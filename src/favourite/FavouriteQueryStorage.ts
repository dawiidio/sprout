import { readFile, writeFile } from 'node:fs/promises';
import { FAVOURITES_FILE_PATH } from '~/consts';

export interface FavouriteQuery {
    naturalLanguage: string
    platformQuery: string
    platformType: string
}

export class FavouriteQueryStorage {
    static favouriteQueries: FavouriteQuery[] = [];

    static async load() {
        const favsStr = await readFile(FAVOURITES_FILE_PATH);
        this.favouriteQueries = JSON.parse(favsStr.toString());
    }

    static getFavouritesForPlatform(type: string) {
        return this.favouriteQueries.filter(fav => fav.platformType === type);
    }

    static async deleteFavourite(query: FavouriteQuery) {
        this.favouriteQueries = this.favouriteQueries.filter(fav => fav.platformQuery !== query.platformQuery);
        await this.saveFile();
    }

    static async saveFavourite(query: FavouriteQuery) {
        this.favouriteQueries.push(query);
        await this.saveFile();
    }

    private static async saveFile() {
        await writeFile(FAVOURITES_FILE_PATH, JSON.stringify(this.favouriteQueries, null, 4));
    }
}