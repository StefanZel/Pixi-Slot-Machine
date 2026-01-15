import * as PIXI from "pixi.js";

export default class StaticUI
{
private static uiElements: any;

public static async loadData() 
	{
		if(!StaticUI.uiElements)
		{
			const response = await fetch("/Data/staticAssets.json");
			StaticUI.uiElements = await response.json();
		}
	}

	public static getAssets(): string[] 
	{
		if(!StaticUI.uiElements)
		{
			console.error("Data not loaded!");
			return []
		}

		const assets = Object.values(StaticUI.uiElements.Elements).map(
		(element: any) => element.asset);

		return assets;
	}

	public static createUI(stage: PIXI.Container, appWidth: number, appHeight: number): void 
	{
		if(!StaticUI.uiElements)
		{
			console.error("Data not laoded!");
			return;
		}

		const elements = StaticUI.uiElements.Elements;

		for(const key in elements)
		{
			const cfg = elements[key];

			const texture = PIXI.Assets.get(cfg.asset);
			const sprite = new PIXI.Sprite(texture);

			sprite.anchor.set(0.5);

			const centerX = appWidth / 2;
			const centerY = appHeight / 2;

			sprite.x = centerX + cfg.x;
			sprite.y = centerY + cfg.y;

			if(cfg.width) sprite.width = cfg.width;
			if(cfg.width) sprite.height = cfg.height;

			sprite.rotation = cfg.rotation ?? 0;

			stage.addChild(sprite);

			console.log("Created UI element:", key);
		}
	}
}

