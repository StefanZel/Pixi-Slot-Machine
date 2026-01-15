import * as PIXI from "pixi.js";
import { ReelConfig, Reel, SlotSymbol, SpinResult, LoadedSymbolData } from "./slotDataTypes";
import { SimulatedServer } from "./simulatedServer.ts";
import { PaylineHighlighter } from "./paylineHighlighter.ts";

export class ReelContainer extends PIXI.Container
{
	private config: ReelConfig;
	private reels: Reel[] = [];
	private reelStrip: string[];
	private simulatedServer: SimulatedServer;

	private paylineHighlighter: PaylineHighlighter;
	private borderTexture: PIXI.Texture;
	
	private readonly MAX_SPIN_TIME = 1500;
	private readonly STOP_DELAY_PER_REEL = 150;
	private readonly SPIN_SPEED = 40;

	//These flags are attempts to fix the issue with spin spamming. They work somehow...
	private isHighlightingInProgress: boolean = false;
	private isSpinInProgress: boolean = false;

	private spinResult: SpinResult | null = null;

	constructor(config: ReelConfig, borderTexture: PIXI.Texture, server: SimulatedServer)
	{
		super();
		this.config = config;
		this.reelStrip = config.reelStrip;
		this.simulatedServer = server;
		this.borderTexture = borderTexture;
		this.initilizeReels();

		this.paylineHighlighter = new PaylineHighlighter(this.reels);
	}

	private initilizeReels()
	{
		for(let i = 0; i < this.config.reelCount; i++)
		{
		const reelContainer = new PIXI.Container();
		
		reelContainer.x = i*(this.config.symbolSize + this.config.reelPadding)
		this.addChild(reelContainer);

		const mask = new PIXI.Graphics();
		mask.fill(0xffffff);
		mask.rect(0,this.config.symbolSize,this.config.symbolSize + 10, this.config.rowCount * this.config.symbolSize);
		mask.fill();

		reelContainer.mask = mask;
		reelContainer.addChild(mask);
		
		const blur = new PIXI.BlurFilter({strength: 1});
		reelContainer.filters = [blur];

		const reel: Reel = 
			{
				container: reelContainer,
				symbols: [],
				position: 0,
				blur: blur,
				spinning: false,
				stripPosition: 0,
				stopPosition: 0,
			};

			this.createInitialSymbols(reel);
			reel.stripPosition = reel.stopPosition;
			this.reels.push(reel);
		}
	}

	private getSymbolData(symbolID: string): LoadedSymbolData | undefined {
		return this.config.symbols.find(s => s.id === symbolID);
	}

	private getSymbolAssetData(stripIndex: number): { symbolID: string, texture: PIXI.Texture }
	{
		const wrappedIndex = stripIndex % this.reelStrip.length;
		const symbolID = this.reelStrip[wrappedIndex < 0 ? wrappedIndex + this.reelStrip.length : wrappedIndex];
		const symbolData = this.getSymbolData(symbolID);

		if(!symbolData)
		{
			throw new Error('Symbol ID "${symbolID}"not found in loaded assets.');
		}

		return {symbolID, texture: symbolData.asset as PIXI.Texture };
	}	
	
	private createSymbolFromStrip(stripIndex: number): SlotSymbol
	{
		const { symbolID, texture } = this.getSymbolAssetData(stripIndex);

		const symbolContainer = new PIXI.Container() as SlotSymbol;
		symbolContainer.width = this.config.symbolSize;
		symbolContainer.height = this.config.symbolSize;
		symbolContainer.symbolID = symbolID;

		const symbolSprite = PIXI.Sprite.from(texture);
		symbolSprite.width = this.config.symbolSize;
		symbolSprite.height = this.config.symbolSize;
		symbolContainer.addChild(symbolSprite);
		symbolContainer.symbolSprite = symbolSprite;

		const highlight = new PIXI.Sprite(this.borderTexture);
		highlight.width = this.config.symbolSize;
		highlight.height = this.config.symbolSize;
		highlight.visible = false;
		symbolContainer.highlightSprite = highlight;


		symbolContainer.addChild(highlight);

		return symbolContainer;
	}

	private createInitialSymbols(reel: Reel)
	{
		const symbolCount = this.config.rowCount + 2;

		const startIndex = Math.floor(Math.random() * this.reelStrip.length);
		reel.stopPosition = startIndex;

		for(let i = 0; i < symbolCount; i++)
		{
			const symbol = this.createSymbolFromStrip(startIndex + i);
			symbol.y = i * this.config.symbolSize;
			reel.container.addChild(symbol);
			reel.symbols.push(symbol);
		}
	}

	public update(dt: number): void
	{
		this.reels.forEach(reel =>{
			if(reel.spinning)
			{
				reel.position += this.SPIN_SPEED * dt;
				this.updateReelSymbols(reel);
				reel.blur.strength = 6;
			} else
			{
				if(reel.blur.strength > 0.1)
				{
					reel.blur.strength  *= 0.9;
				} else
				{
					reel.blur.strength = 0;
				}
			}
		});
	}

	private updateReelSymbols(reel: Reel)
	{
		const symbolSize = this.config.symbolSize;
		const numSymbols = reel.symbols.length;

		const recycledIndex = Math.floor(reel.position / symbolSize);
	
		if(recycledIndex > 0)
		{
			const recycleCount = recycledIndex;

			for(let i = 0; i < recycleCount; i++)
			{
				const symbolToRecycle = reel.symbols.pop()!;
				reel.symbols.unshift(symbolToRecycle);

				const nextStripIndex = reel.stripPosition - 1 - i;

				const newSymbol = this.getSymbolAssetData(nextStripIndex);
				symbolToRecycle.symbolSprite.texture = newSymbol.texture;
				symbolToRecycle.symbolID = newSymbol.symbolID;
			}
			reel.stripPosition -= recycleCount;
			reel.position -= recycleCount * symbolSize;
		}

		for (let i = 0; i < numSymbols; i++)
		{
			const symbol = reel.symbols[i];
			symbol.y = Math.round((i * symbolSize) + reel.position);
		}
	}

	public async startSpin(currentBet: number): Promise<void>
	{
		if(this.isSpinInProgress || this.isHighlightingInProgress)
		{
			if(this.spinResult)
			{
				if(this.isHighlightingInProgress) return;
				await this.stopSpinNow(this.spinResult);
				this.spinResult = null;
				this.isSpinInProgress = false;
				return;
			}
			return;
		}

		this.isSpinInProgress = true;

		this.paylineHighlighter.toggleHighlights([], false);
		this.reels.forEach(reel => 
		{
			reel.spinning = true;
			reel.position = 0;
			reel.stripPosition = reel.stopPosition;
		});

		const spinResult: SpinResult = await this.simulatedServer.spin(currentBet);
		this.spinResult = spinResult;

		await new Promise(resolve => { setTimeout(resolve, this.MAX_SPIN_TIME); });
		
		console.log("SpinResult from server", spinResult);

		if(this.reels.some(i => i.spinning) && this.spinResult)
		{
			await this.stopSpin(spinResult);
			this.simulatedServer.winBalanceChange(spinResult.winValue);
		}

		this.spinResult = null;
		this.isSpinInProgress = false;
	}

	private async stopSpinNow(spinResult: SpinResult): Promise<void>
	{
		for(let i = 0; i < this.reels.length; i++)
		{
			this.stopReel(this.reels[i], spinResult.finalStopStripIndices[i]);
		}
		
		await new Promise(resolve => setTimeout(resolve, 50));

		if (spinResult.paylinesHit.length > 0)
		{
			this.isHighlightingInProgress = true;
			await this.paylineHighlighter.toggleHighlights(spinResult.paylinesHit, true);
			this.isHighlightingInProgress = false;

		}
		this.simulatedServer.winBalanceChange(spinResult.winValue);
	}

	private async stopSpin(spinResult: SpinResult): Promise<void>
	{
	
		for(let i = 0; i < this.reels.length; i++)
		{
			if(!this.reels[i].spinning) continue;
			await new Promise(resolve => setTimeout(resolve, i * this.STOP_DELAY_PER_REEL));
			this.stopReel(this.reels[i], spinResult.finalStopStripIndices[i]);
		}

		if (spinResult.paylinesHit.length > 0)
		{
			this.isHighlightingInProgress = true;
			await this.paylineHighlighter.toggleHighlights(spinResult.paylinesHit, true);
			this.isHighlightingInProgress = false;
		}
	}

	private stopReel(reel: Reel, finalStripIndex: number)
	{
		reel.stopPosition = finalStripIndex;
		reel.spinning = false;

		this.snapToGrid(reel,finalStripIndex);
	}
	private snapToGrid(reel: Reel, finalStripIndex: number)
	{
		const symbolSize = this.config.symbolSize;
		const stripLenght = this.reelStrip.length;

		const TargetVisibleRowIndex = 1;
		reel.position = 0;
		reel.stopPosition = finalStripIndex;

		for(let i = 0; i < reel.symbols.length; i++)
		{
			let stripIndex = finalStripIndex + (i - TargetVisibleRowIndex);
			stripIndex = (stripIndex % stripLenght + stripLenght) % stripLenght;

			const symbolSprite = reel.symbols[i];
			const newSymbolData = this.getSymbolAssetData(stripIndex);

			symbolSprite.symbolSprite.texture = newSymbolData.texture;
			symbolSprite.symbolID = newSymbolData.symbolID;

			symbolSprite.y = i * symbolSize;
		}
	}
}

