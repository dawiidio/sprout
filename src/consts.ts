import { join, basename } from 'node:path';
import { homedir, tmpdir } from 'node:os';

export const HOME_DIR_PATH = join(homedir(), 'sprout');
export const FAVOURITES_FILE_PATH = join(HOME_DIR_PATH, 'favourites.json');
export const CONFIG_FILE_NAME = 'sprout.config.ts';
export const PATH_TO_CONFIG_FILE = join(process.cwd(), CONFIG_FILE_NAME);
export const TMP_DIR = join(tmpdir(), `sprout-tmp-${basename(process.cwd())}`);
export const PATH_TO_CONFIG_HASH_FILE = join(TMP_DIR, 'sprout.config.hash');
export const ENV_FILE_NAME = '.sprout.env';
export const PATH_TO_LOCAL_ENV = join(process.cwd(), ENV_FILE_NAME);
export const PATH_TO_GLOBAL_ENV = join(HOME_DIR_PATH, ENV_FILE_NAME);
export const SPROUT_CONFIG_FILE_TS_CONFIG = {
    "exclude": ["**/*.spec.ts"],
    "include": ["src/**/*.ts"],
    "compilerOptions": {
        "lib": ["DOM", "DOM.Iterable", "ES2021"],
        "types": [
            "node"
        ],
        "esModuleInterop": true,
        "strict": true,
        "baseUrl": ".",
        "paths": {
            "~/*": ["src/*"],
            "test/*": ["test/*"]
        },
        "forceConsistentCasingInFileNames": true,
        "downlevelIteration": true,
        "skipLibCheck": true,
        "declaration": true,
        "removeComments": true,
        "rootDir": "src",
        "module": "NodeNext",
        "target": "ES2022",
        "outDir": "dist"
    }
};

export const SPROUT_CONFIG_FILE_PACKAGE_JSON = {
    name: 'sprout-tmp',
    version: '1.0.0',
    description: 'Temporary package for sprout',
    main: 'index.js',
    scripts: {
        test: 'echo "Error: no test specified" && exit 1',
    },
    keywords: [],
};

export const SAMPLE_CONFIG = `
import { 
    SproutConfigFunction, 
    JiraCli,
    Ollama,
    GitCli,
    GenericTaskRenderer,
    OpenAi,
} from '@dawiidio/sprout';

export const getConfig: SproutConfigFunction = async () => {
    return {
        projectCli: new JiraCli(),
        llmCli: {
            code: new Ollama('dolphincoder:15b-starcoder2-q5_K_M'),
            text: new OpenAi({
                model: 'gpt-4',
                max_tokens: 100,
            }),
        },
        vcsCli: new GitCli(),
        taskRenderer: new GenericTaskRenderer(),
    }
}
`;

export const SAMPLE_ENV = `JIRA_API_KEY=jira-api-key
JIRA_EMAIL=your@email.com
JIRA_DEFAULT_PROJECT_KEY=ABC
JIRA_URL=https://your-domain.atlassian.net
OPENAI_API_KEY=sk-api-key
`;