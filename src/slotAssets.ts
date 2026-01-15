import *as PIXI from "pixi.js";
import { SymbolData, SlotAssetConfig, LoadedSymbolData, ReelConfig } from "./slotDataTypes";


export default class SlotAssets
{
	private static slotConfig: SlotAssetConfig | null = null;
	private static reelConfig: ReelConfig | null = null;
	private static readonly CONFIG_PATH = "/Data/symbolAssets.json";
	private static readonly BORDER_ASSET_PATH = "/assets/highlightPicture2.png";

	private static async loadConfig()
	{
		if(!SlotAssets.slotConfig)
		{
			const response = await fetch(SlotAssets.CONFIG_PATH);
			SlotAssets.slotConfig = await response.json();
		}
	}
	
	public static async getAssetPaths(): Promise<string[]>
	{
		await SlotAssets.loadConfig();
		if(!SlotAssets.slotConfig) return [];

		const slotAssets = SlotAssets.slotConfig.symbolDefinitions.map(
			(def: SymbolData) => def.asset
		);

		slotAssets.push(SlotAssets.BORDER_ASSET_PATH);

		return slotAssets;
	}

	public static getBorderTexture(): PIXI.Texture
	{
		const borderTexture = PIXI.Assets.get(SlotAssets.BORDER_ASSET_PATH);
		if(!borderTexture)
		{
			throw new Error("Reel border not loaded");
		}
		return borderTexture;
	}

	public static createReelConfig(): ReelConfig
	{
		if(SlotAssets.reelConfig)
		{
			return SlotAssets.reelConfig;
		}

		if(!SlotAssets.slotConfig)
		{
			throw new Error("Slot configuration not loaded")
		}

		const slotCfg = SlotAssets.slotConfig.slotConfig;

		const loadedSymbols: LoadedSymbolData[] = SlotAssets.slotConfig.symbolDefinitions.map(def => 
		{
			const texture = PIXI.Assets.get(def.asset);

			if(!texture)
			{
				console.error("Texture not found for path: ${def.asset}");
				throw new Error("Missing asset: " + def.id);
			}
			
			return {
				id: def.id,
				asset: texture,
				value: def.value,
			};
		});

		SlotAssets.reelConfig = {
			reelCount: slotCfg.reelCount,
			rowCount: slotCfg.rowCount,
			symbolSize: slotCfg.symbolSize,
			reelPadding: slotCfg.reelPadding,
			symbols: loadedSymbols,
			reelStrip: SlotAssets.slotConfig.reelStrip,
		};

		return SlotAssets.reelConfig;
	}
}
