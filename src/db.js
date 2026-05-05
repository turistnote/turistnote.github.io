import Dexie from "dexie";

export const db = new Dexie("TuristNoteDB");

db.version(1).stores({
  trips: "++id, name, date, lat, lng, restaurant, azimuth, createdAt",
});
