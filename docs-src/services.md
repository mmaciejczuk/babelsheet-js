## CLI
Command line tool is used to obtain `BABELSHEET_REFRESH_TOKEN`, as well as to generate translations files.
Translations files are possible to generate in given formats:

- Android
- iOS
- JSON
- YML

To run command line tools, you need to install it first:

`npm i -g babelsheet`


If you want to obtain `BABELSHEET_REFRESH_TOKEN` then see [generating refresh token](configuration.md#generating-refresh-token) section.

### Generating translations files

To generate translations type:

`babelsheet generate [options]`

Remember to [create .env.babelsheet file](configuration.md#configuration-file) before generating translations.

<small>If you wont provide `BABELSHEET_REFRESH_TOKEN` in `.env.babelsheet` file or `data.json` file, babelsheet will automatically open browser to create such token, and will save it in right storage - you can change read and write storages, check it [here](development.md#set-refresh-token-read-providers).</small>

**Options**
<details>
  <summary>--config-format</summary>
  <p>
    (alias: <code>-cf</code>)
  </p>
  <p>
    (default: <code>env</code>)
  </p>
  <p>
    Where to store config (refresh token) env/json.
  </p>
</details>
<details>
  <summary>--format</summary>
  <p>
    (alias: <code>-f</code>)
  </p>
  <p>
    (default: <code>json</code>)
  </p>
  <p>
    Format type (_android/ios/json/yml/xlf_).
  </p>
</details>
<details>
  <summary>--path</summary>
  <p>
    (alias: <code>-p</code>)
  </p>
  <p>
    (default: <code>.</code>)
  </p>
  <p>
    Path for saving files.
  </p>
</details>
<details>
  <summary>--language</summary>
  <p>
    (alias: <code>-l</code>)
  </p>
  <p>
    Language code for generating translations only in given language.
  </p>
</details>
<details>
  <summary>--filename</summary>
  <p>
    (alias: <code>-n</code>)
  </p>
  <p>
    (default: <code>translations</code>)
  </p>
  <p>
    Filename of final translation file.
  </p>
</details>
<details>
  <summary>--base</summary>
  <p>
    (default: <code>EN</code>)
  </p>
  <p>
    Base language for translations. `Base.lproj` folder on iOS format and `values` folder on android format.
  </p>
</details>
<details>
  <summary>--merge</summary>
  <p>
    Creates one file with all languages.
  </p>
</details>
<details>
  <summary>--client_id</summary>
  <p>
    Client id received from Google. Overwrite .env.babelsheet `BABELSHEET_CLIENT_ID` value. ([see how to obtain](configuration.md#configuring-google-spreadsheet-api))
  </p>
</details>
<details>
  <summary>--client_secret</summary>
  <p>
    Client secret received from Google. Overwrite .env.babelsheet `BABELSHEET_CLIENT_SECRET` value. ([see how to obtain](configuration.md#configuring-google-spreadsheet-api))
  </p>
</details>
<details>
  <summary>--spreadsheet_id</summary>
  <p>
    Spreadsheet ID from spreadsheet URL. Overwrite .env.babelsheet `BABELSHEET_SPREADSHEET_ID` value. ([see how to obtain](configuration.md#how-to-get-spreadsheet-id))
  </p>
</details>
<details>
  <summary>--spreadsheet_name</summary>
  <p>
    Sheet name. Overwrite .env.babelsheet `BABELSHEET_SPREADSHEET_NAME` value. ([see how to obtain](configuration.md#how-to-get-spreadsheet-name))
  </p>
</details>
<details>
  <summary>--spreadsheet_name</summary>
  <p>
    Url to which user should be redirected after receiving refresh token. Overwrite .env.babelsheet `BABELSHEET_REDIRECT_URI` value. ([see how to obtain](configuration.md/#how-to-get-spreadsheet-name))
  </p>
</details>
<details>
  <summary>--help</summary>
  <p>
    Help menu.
  </p>
</details>

**Examples**

`babelsheet generate -f json -n my-own-en-translations -l en_US -p ./my-folder` - generates english translations in `my-own-en-translations.json` file inside `./my-folder` folder.

`babelsheet generate --format ios --path ./translations` - generates translations in iOS format in `./translations` folder.

## Producer
Producer is used to fetch translations file, convert it and then store it in a database. The process is wrapped in a scheduler which repeats the whole operation continuously every 5 minutes by default. Please note that if there are no proper environment variables such as `BABELSHEET_CLIENT_ID`, `BABELSHEET_CLIENT_SECRET` and `BABELSHEET_REFRESH_TOKEN` then producer wont be able to work properly. In such case it runs a command responsible for obtaining those keys.

You can run Producer in docker container - see [Docker](docker.md).

If you want to run producer locally, first remember about [setting environment variables](configuration.md#configuration-file) and [running redis](docker.md#redis), next type:

1. `npm run dev-install`

2. `npm run dev-start-producer`

Producer should be working now.

You can change `BABELSHEET_REFRESH_TOKEN` read and write providers, check it [here](development.md#set-refresh-token-read-providers).

You can also change translations storage from redis to file, check it [here](development.md#change-translations-storage-from-redis-to-file).

## API
API is a web server built on top of `express.js` which serves translations. There is one endpoint available to obtain translations, which is `/translations`.
Translations can be filtered by using:

- `filters[]` -  e.g. calling `/translations?filters[]=en_US.CORE` will result in getting translations for `en_US` locale and section `CORE`. Other possibility is to use tag as a filter, e.g. `/translations?filters[]=en_US.tag1`.

- `format` - translations can be served in json/android/ios/yml/xlf formats, just add adtitional parameter e.g. `/translations?filters[]=en_US.CORE&format=android`.

You can run API in docker container - see [Docker](docker.md).

If you want to run API locally, first remember about [setting environment variables](configuration.md#configuration-file) and [running redis](docker.md#redis), next type:

1. `npm run dev-install`

2. `npm run dev-start-api`

API should be working now.

### Usage
```
curl -X GET -g 'http://localhost:3000/translations'
curl -X GET -g 'http://localhost:3000/translations?filters[]=en_US.CORE'
curl -X GET -g 'http://localhost:3000/translations?filters[]=en_US.CORE.LABELS&format=android'
```
