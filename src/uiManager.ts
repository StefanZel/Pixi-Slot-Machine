import * as PIXI from "pixi.js";
import { BetManager } from "./betManager.ts";
import { ButtonConfigMap, GameActions } from "./slotDataTypes.ts";


export class UIManager extends PIXI.Container 
{
	private app: PIXI.Application;
	public betManager: BetManager;
	public startSpin: GameActions['startSpin'];
	private buttonConfig: ButtonConfigMap;

	private spinButton!: PIXI.Sprite;
	//private readonly SPIN_COOLDOWN = 100;

	private balanceDisplay!: PIXI.Text;
	private betDisplay!: PIXI.Text;

	constructor(
		app: PIXI.Application,
		betManager: BetManager,
		startSpinAction: GameActions['startSpin'],
		buttonConfig: ButtonConfigMap)
	{
		super();
		this.app = app;
		this.betManager = betManager;
		this.startSpin = startSpinAction;
		this.buttonConfig = buttonConfig;

		this.setupBetDisplay();
		this.createSpinButton();
		this.createBetButtons(); 
  }
	
	private setupBetDisplay(): void
	{
		const style = new PIXI.TextStyle({
			fontFamily: "Arial",
			fontSize: 24,
			fill: "white",
			stroke: { color: "#4a1850", width: 2},
		});

		this.balanceDisplay = new PIXI.Text({ text: "BALANCE: 0", style});
		this.balanceDisplay.x = this.app.renderer.width / 4;
		this.balanceDisplay.y = this.app.renderer.height / 1.3;
		this.addChild(this.balanceDisplay);

		this.betDisplay = new PIXI.Text({ text: "BET: 0", style});
		const X = this.app.renderer.width / 1.5;
		this.betDisplay.x = X - 10;
		this.betDisplay.y = this.app.renderer.height / 1.3;
		this.addChild(this.betDisplay);
	}

	public updateBetDisplay(newBet: number): void {
		this.betDisplay.text = `BET: $${Math.floor(newBet)}`;
	}

	public updateBalanceDisplay(newBalance: number): void {
		this.balanceDisplay.text = `Balance: $${Math.floor(newBalance)}`;
	}

	public toggleSpinButton(enabled: boolean): void
	{
		this.spinButton.eventMode = enabled ? "static" : "none";
		this.spinButton.alpha = enabled ? 1.0 : 0.5;
		this.spinButton.cursor = enabled ? "pointer" : "default";
	}
	private createSpinButton(): void 
	{
		const cfg = this.buttonConfig.spin;

		if(!cfg.asset)
		{
			console.error("Spin button asset missing");
			return;
		}

		const texture = PIXI.Assets.get(cfg.asset);
		this.spinButton = new PIXI.Sprite(texture);

		this.spinButton.width = cfg.width;
		this.spinButton.height = cfg.height;
		const centerX = this.app.renderer.width / 2;
		const bottomY = this.app.renderer.height;

		this.spinButton.x = centerX + cfg.x;
		this.spinButton.y = bottomY + cfg.y;
		this.spinButton.eventMode = "static";
		this.spinButton.cursor = "pointer";

		this.spinButton.on("pointerdown", () =>
		{
			console.log("Spinning reels via UI Manager!");
			this.startSpin(this.betManager.getCurrentBet());
			});

		this.addChild(this.spinButton);
  }

	/*private async handleSpinRequest(): Promise<void>
	{
		this.toggleSpinButton(false);
		try
		{
			await this.startSpin(this.betManager.getCurrentBet());
		}catch(error)
		{
			console.log("Error during spin:", error);
		}finally
		{
			await new Promise(resolve=>setTimeout(resolve, this.SPIN_COOLDOWN));
			this.toggleSpinButton(true);
		}
	}*/

	private createBetButtons(): void 
	{
		const X = this.app.renderer.width / 1.5;
		const bottomY = this.app.renderer.height / 1.2;
		const minusCfg = this.buttonConfig.betMinus;
		const minusTexture = PIXI.Assets.get(minusCfg.asset!);
		const minusButton = new PIXI.Sprite(minusTexture);

		minusButton.width = minusCfg.width;
		minusButton.height = minusCfg.height;
		minusButton.x = X + minusCfg.x;
		minusButton.y = bottomY + minusCfg.y;
		minusButton.eventMode = "static";
		minusButton.cursor = "pointer";

		minusButton.on("pointerdown", () =>
		{
			this.betManager.decrementBet();
		});
		this.addChild(minusButton);

		const plusCfg = this.buttonConfig.betPlus;
		const plusTexture = PIXI.Assets.get(plusCfg.asset!);
		const plusButton = new PIXI.Sprite(plusTexture);
		
		plusButton.width = plusCfg.width;
		plusButton.height = plusCfg.height;
		plusButton.x = X + plusCfg.x;
		plusButton.y = bottomY + plusCfg.y;
		
		plusButton.eventMode = "static";
		plusButton.cursor = "pointer";

		plusButton.on("pointerdown", () =>
		{
			this.betManager.incrementBet();
		});
		this.addChild(plusButton);
	}
}
