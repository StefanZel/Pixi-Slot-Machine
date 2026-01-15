import { ReelConfig, LoadedSymbolData, SpinResult, PayLineHit, WinSymbolCoordinates, BalanceUpdate } from "./slotDataTypes";

type PaylinePattern = number[];

export class SimulatedServer
{
	private reelStrip: string[];
	private reelCount: number;
	private symbols: LoadedSymbolData[];
	
	private paylines: PaylinePattern[] = [];

	//This stayed due to testing 3 match wins.
	private readonly MIN_MATCH_COUNT = 5;
	private readonly REEL_COUNT = 5;

	private playerBalance: number = 1000;
	private updateBalance: BalanceUpdate["updateBalance"];

	constructor(config: ReelConfig, updateBalanceDelegate: BalanceUpdate["updateBalance"])
	{
		this.reelStrip = config.reelStrip;
		this.reelCount = config.reelCount;
		this.symbols = config.symbols;
		this.updateBalance = updateBalanceDelegate;
		this.loadPaylines();
		this.updateBalance(this.playerBalance);
	}

	private async loadPaylines()
	{
		const response = await fetch("/Data/paylines.json")
		this.paylines = await response.json()
		console.log(`Loaded ${this.paylines.length} paylines.`);
	}

	public async spin(currentBet: number): Promise<SpinResult>
	{
		this.playerBalance = this.playerBalance - currentBet;
		this.updateBalance(this.playerBalance);

		const finalStopStripIndices: number[] = [];
		const stripLenght = this.reelStrip.length;

		for (let i = 0; i < this.reelCount; i++)
		{
			const randomIndex = Math.floor(Math.random() * stripLenght);
			finalStopStripIndices.push(randomIndex);
		}

		this.debug_ShowGrid(finalStopStripIndices);

		const paylinesHit = this.checkForWins(finalStopStripIndices);
		
		const winValue = paylinesHit.length > 0 ? this.calculateTotalWin(paylinesHit, currentBet) : 0 ;

		//This was supposed to serve as the indicator for animations...
		const tempResultName = winValue > 0 ? "Win" : "NoWin";
		
		return {
			resultName: tempResultName,
			finalStopStripIndices: finalStopStripIndices,
			paylinesHit: paylinesHit,
			winValue: winValue,
		};
	}

	public winBalanceChange(winValue: number): void
	{
		this.playerBalance = this.playerBalance + winValue;
		this.updateBalance(this.playerBalance);
	}

	private checkForWins(finalStopStripIndices: number[]): PayLineHit[]
	{
		const wins: PayLineHit[] = [];

		for(let lineIndex = 0; lineIndex < this.paylines.length; lineIndex++)
		{
			const rowPattern = this.paylines[lineIndex];

			const symbolsOnStrip: string[] = [];
			for(let i = 0; i < this.REEL_COUNT; i++)
			{
				symbolsOnStrip.push(this.getSymbolAtPosition(i, rowPattern[i], finalStopStripIndices));
			}

			let currentMatchCount = 1;
			let winningSymbol = symbolsOnStrip[0];
			let winningPositions: WinSymbolCoordinates[] = [{ reel: 0, row: rowPattern[0]}];

			for (let i = 1; i < this.REEL_COUNT; i++)
			{
				if(symbolsOnStrip[i] === winningSymbol)
				{
					currentMatchCount++;
					winningPositions.push({ reel: i, row: rowPattern[i]});
				} else
				{
					break;
				}
			}
			if(currentMatchCount >= this.MIN_MATCH_COUNT)
				{
					const winType = `${currentMatchCount}` as "3x" | "4x" | "5x";
					wins.push({ lineID: lineIndex + 1, winType: winType, symbolCordinates: winningPositions, winningSymbolID: winningSymbol });
				}
		}
		return wins;
	}

	private calculateTotalWin(paylinesHit: PayLineHit[], currentBet: number): number
	{
		let totalWin = 0;

		paylinesHit.forEach(win => 
		{
			const symbolData = this.symbols.find(s => s.id === win.winningSymbolID);
			if(symbolData)
			{
				totalWin += symbolData.value * currentBet;
			}
		});

		return totalWin;
	}

	private getSymbolAtPosition(reelIndex: number, rowPattern: number, finalStopStripIndices: number[]) : string
	{
		let stripIndex = finalStopStripIndices[reelIndex] + rowPattern;
		const stripLenght = this.reelStrip.length;
		stripIndex = (stripIndex % stripLenght + stripLenght) % stripLenght;
		return this.reelStrip[stripIndex];
	}

	private debug_ShowGrid(finalStopStripIndices: number[])
	{
		const visibleGrid: string[][] = [];
		const ROW_COUNT = 3;

		for (let r = 0; r < ROW_COUNT; r++) 
		{
			const rowSymbols: string[] = [];
			for (let c = 0; c < this.reelCount; c++) 
			{
				let stripIndex = finalStopStripIndices[c] + r; 
				const stripLenght = this.reelStrip.length;
				stripIndex = (stripIndex % stripLenght + stripLenght) % stripLenght;
				rowSymbols.push(this.reelStrip[stripIndex]);
			}
			visibleGrid.push(rowSymbols);
		}
		console.log("--- VISIBLE GRID ---");
		console.log("Row 0 (Top):   ", visibleGrid[0].join(' '));
		console.log("Row 1 (Middle):", visibleGrid[1].join(' '));
		console.log("Row 2 (Bottom):", visibleGrid[2].join(' '));
	}
}
