//import * as PIXI from "pixi.js"
import { Reel, PayLineHit } from "./slotDataTypes";

export class PaylineHighlighter
{
	private reels: Reel[];

	private readonly PAYLINE_DELAY = 700;

	private readonly PAYLINE_COLORS: { [key: number]: number } = {
		0: 0xFF0000,
		1: 0x00FF00,
		2: 0x0000FF,
		3: 0xFFFF00,
		4: 0x00FFFF,
		5: 0xFF00FF,
		6: 0xFF8800,
		7: 0x8800FF,
		8: 0x00FF88,
	};

	constructor(reels: Reel[])
	{
		this.reels = reels;
	}

	public async toggleHighlights(winningPaylines: PayLineHit[], enable: boolean): Promise<void> 
	{
		this.reels.forEach(reel =>
		{
			reel.symbols.forEach(symbol =>
			{
				if (symbol.highlightSprite)
				{
					symbol.highlightSprite.visible = false;
					symbol.highlightSprite.tint = 0xFFFFFF;
					symbol.highlightSprite.alpha = 1.0;
				}
			});
		});

		if (!enable || winningPaylines.length === 0) {
			return;
		}

		for(let i = 0; i < winningPaylines.length; i++)
		{
			const highlightColor = this.getPaylineColor(i);
		//const applyAnimation = this.shouldApplyAnimation(winningPaylines[i].winType);

			winningPaylines[i].symbolCordinates.forEach( pos => 
			{
				const { reel, row } = pos;
				const symbolIndex = row + 1; 

				if (reel < this.reels.length && symbolIndex < this.reels[reel].symbols.length) 
				{
					const winningSymbol = this.reels[reel].symbols[symbolIndex];
					const highlightSprite = winningSymbol.highlightSprite;
					
					highlightSprite.visible = true;
					highlightSprite.tint = highlightColor;

					/*if (applyAnimation) 
					{
						this.applyPulseAnimation(highlightSprite);
					}*/
				}
			});

			await new Promise(resolve => setTimeout(resolve, this.PAYLINE_DELAY));

		}
	}
	private getPaylineColor(lineID: number): number
	{
		return this.PAYLINE_COLORS[lineID] || 0xFFFFFF;
	}

	/*private shouldApplyAnimation(winType: string): boolean 
	{
		return winType === '4x' || winType === '5x';
	}

	private applyPulseAnimation(sprite: PIXI.Sprite): void 
	{
		sprite.alpha = 0.5; 
	}*/
}

