export const dailyPayload = async () => {
  const file = Bun.file("./db.json");
  const json = await file.json();
};
