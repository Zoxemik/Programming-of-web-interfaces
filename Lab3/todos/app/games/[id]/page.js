import GameDetailsPage from "@/components/GameDetailsPage";

export default async function Page(Props)
{
  const Params = await Props.params;

  return <GameDetailsPage GameId={Params.id} />;
}