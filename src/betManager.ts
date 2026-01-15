import { BalanceUpdate } from "./slotDataTypes";

export class BetManager 
{
	private currentBetIndex: number = 0;
	private readonly BET_STEPS: number[] = [1, 5, 10, 25, 50, 100];
	
	private updateBet: BalanceUpdate['updateBet'];

	constructor(updateBetDelegate: BalanceUpdate["updateBet"])
	{
		this.updateBet = updateBetDelegate;

		this.updateBet(this.getCurrentBet());
	}

  public incrementBet(): number 
	{
		if(this.currentBetIndex < this.BET_STEPS.length - 1)
		{
			this.currentBetIndex++;
			this.updateBet(this.getCurrentBet());
		}
    return this.getCurrentBet();
  }

	public decrementBet(): number 
	{
		if(this.currentBetIndex > 0)
		{
			this.currentBetIndex--;
			this.updateBet(this.getCurrentBet());
		}
    return this.getCurrentBet();
	}

	public getCurrentBet(): number {
		return this.BET_STEPS[this.currentBetIndex];
	}
}
