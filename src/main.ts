import Game from "./game"

async function main()
{
	try 
	{
		const gameInstance = await Game.create();
		console.log("Game started!", gameInstance);
	} catch (error) {
		console.error("Failed to start:", error);
	}
}

main()

