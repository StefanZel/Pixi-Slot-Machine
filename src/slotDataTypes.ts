import * as PIXI from "pixi.js";

export interface SymbolData
{
	id: string;
	asset: string;
	value: number;
}

export interface SlotAssetConfig
{
	symbolDefinitions: SymbolData[];
	reelStrip: string[];
	slotConfig:
	{
		reelCount: number;
		rowCount: number;
		symbolSize: number;
		reelPadding: number;
	}
}

export interface LoadedSymbolData
{
	id: string;
	asset: PIXI.Texture;
	value: number;
}

export interface ReelConfig
{
	reelCount: number;
	rowCount: number;
	symbolSize: number;
	reelPadding: number;
	symbols: LoadedSymbolData[];
	reelStrip: string[];
}

export interface SlotSymbol extends PIXI.Container
{
	symbolID: string;
	symbolSprite: PIXI.Sprite;
	highlightSprite: PIXI.Sprite; 
}

export interface Reel
{
	container: PIXI.Container;
	symbols: SlotSymbol[];
	position: number;
	blur: PIXI.BlurFilter;
	spinning: boolean;
	stripPosition: number;
	stopPosition: number;
}
export interface WinSymbolCoordinates
{
	reel: number;
	row: number;
}

export interface PayLineHit
{
	lineID: number;
	winType: '3x' | '4x' | '5x';
	symbolCordinates: WinSymbolCoordinates[];
	winningSymbolID: string;
}

export interface SpinResult
{
	resultName: string;
	finalStopStripIndices: number[];
	paylinesHit: PayLineHit[];
	winValue: number;
}

export interface ButtonConfig
{
	type: "sprite";
	asset?: string;
	color?: string | number;
	width: number;
	height: number;
	x: number;
	y: number;
}

export interface ButtonConfigMap
{
	spin: ButtonConfig;
	betPlus: ButtonConfig;
	betMinus: ButtonConfig;
}

export interface GameActions 
{
	startSpin: (currentBet: number) => Promise<void>
}

export interface BalanceUpdate
{
	updateBalance: (newBalance: number) => void;
	updateBet: (newBet: number) => void;
}
