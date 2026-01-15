import * as PIXI from "pixi.js";
import StaticUI from "./staticUI";
import SlotAssets from "./slotAssets.ts";
import { ReelContainer} from "./reelContainer.ts"
import { ReelConfig, ButtonConfigMap } from "./slotDataTypes.ts"
import { BetManager } from "./betManager.ts";
import { UIManager } from "./uiManager.ts";
import { SimulatedServer } from "./simulatedServer.ts";


export default class Game 
{
	public app: PIXI.Application;

	private static buttonConfig: ButtonConfigMap;
	private static readonly UI_CONFIG_PATH = "/Data/interactiveAssets.json"

	private constructor(app: PIXI.Application) 
	{
			this.app = app;
	}

	public static async create(): Promise<Game> {
		const app = new PIXI.Application();
		await app.init({ background: "#1099bb", resizeTo: window })

		document.getElementById("pixi-container")!.appendChild(app.canvas);

		const game = new Game(app);

		await game.loadAssets();

		game.setupScene();

		return game;
	}

	private async loadAssets()
	{
		await StaticUI.loadData()

		const interactiveAssets = await this.getUIAssets();
		const uiAssets = StaticUI.getAssets();
		const slotAssetPaths = await SlotAssets.getAssetPaths();

		const allAssets = [...slotAssetPaths, ...interactiveAssets, ...uiAssets];
		
		console.log(allAssets);
		await PIXI.Assets.load(allAssets);
	}

	private setupScene() {

		const reelConfig: ReelConfig = SlotAssets.createReelConfig();
		const borderTexture = SlotAssets.getBorderTexture();
		const buttonConfig = Game.buttonConfig!;

	
		const uiManager = new UIManager(this.app, null as any, null as any, buttonConfig);
		const betManager = new BetManager(uiManager.updateBetDisplay.bind(uiManager));
		const simulatedServer = new SimulatedServer(reelConfig, uiManager.updateBalanceDisplay.bind(uiManager));
		const reelContainer = new ReelContainer(reelConfig, borderTexture, simulatedServer);

		uiManager.betManager = betManager;
		uiManager.startSpin = reelContainer.startSpin.bind(reelContainer);

		const totalReelWidth = reelConfig.reelCount * reelConfig.symbolSize + (reelConfig.reelCount - 1) * reelConfig.reelPadding;
		const visibleReelHeight = reelConfig.rowCount * reelConfig.symbolSize;

		const appWidth = this.app.renderer.width;
		const appHeight = this.app.renderer.height;
	
		reelContainer.x =  appWidth / 2 - totalReelWidth / 2;
		reelContainer.y = appHeight / 2 - visibleReelHeight / 2 - reelConfig.symbolSize;


		this.app.stage.addChild(reelContainer);
		StaticUI.createUI(this.app.stage, appWidth, appHeight);
		this.app.stage.addChild(uiManager)

		this.app.ticker.add((ticker: PIXI.Ticker) =>{
			reelContainer.update(ticker.deltaTime);
		});

		console.log("Game ready!");

	}

	private async getUIAssets(): Promise<string[]>
	{
		const reponse = await fetch(Game.UI_CONFIG_PATH);
		Game.buttonConfig = await reponse.json() as ButtonConfigMap;

		const buttonConfig = Game.buttonConfig!;
		const buttonAssetPaths: string[] = [];

		Object.values(buttonConfig).forEach(config =>
		{
			if(config.asset)
			{
				buttonAssetPaths.push(config.asset);
			}
			});

		return buttonAssetPaths;
	}
	
}
