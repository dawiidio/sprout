import { join } from 'node:path';
import { homedir } from 'node:os';
export const HOME_DIR_PATH = join(homedir(), 'sprout');
export const FAVOURITES_FILE_PATH = join(HOME_DIR_PATH, 'favourites.json');