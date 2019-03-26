import { ILogger } from 'tsh-node-common';
import { Arguments } from 'yargs';
import IFileRepository from '../../infrastructure/repository/file-repository.types';
import { Permission } from '../../infrastructure/repository/file-repository.types';
import InEnvStorage from '../../infrastructure/storage/in-env';
import IStorage from '../../infrastructure/storage/storage';
import { getExtension } from '../../shared/formatToExtensions';
import GoogleAuth from '../../shared/google/auth';
import { ISheetsProvider } from '../../shared/sheets-provider/sheets-provider.types';
import Transformers from '../../shared/transformers/transformers';
import FilesCreators from './files-creators/files-creators';
import { ISpreadsheetConfigService } from './spreadsheet-config-providers/spreadsheet-config-provider.types';

function checkFolderPermissions(logger: ILogger, fileRepository: IFileRepository, path: string): void {
  const canWrite = fileRepository.hasAccess(path, Permission.Write);

  if (!canWrite) {
    logger.error(`No access to '${path}'`);
    process.exit(1);
  }
}

export async function generateTranslations(
  logger: ILogger,
  fileRepository: IFileRepository,
  sheetsProvider: ISheetsProvider,
  configProvider: ISpreadsheetConfigService,
  transformers: Transformers,
  filesCreators: FilesCreators,
  args: Arguments
) {
  const { info } = logger;

  info('Getting auth variables...');
  const spreadsheetConfig = configProvider.getSpreadsheetConfig(args);

  info('Checking auth variables...');
  configProvider.validateConfig(spreadsheetConfig);

  info('Checking formats...');
  const extension = getExtension(args.format);

  info('Checking folder permissions...');
  checkFolderPermissions(logger, fileRepository, args.path);

  info('Reading spreadsheet...');
  const spreadsheetData = await sheetsProvider.getSpreadsheetValues(spreadsheetConfig);
  info('Spreadsheet fetched successfully.');

  const transformedSheets: { [key: string]: any } = await Object.keys(spreadsheetData).reduce(
    async (transformedSheetsPromise: Promise<{ [key: string]: any }>, key) => {
      info(`Formatting spreadsheet - version ${key}`);

      const values = spreadsheetData[key];

      if (!values) {
        return transformedSheetsPromise;
      }

      const data = await transformers.transform(
        {
          result: spreadsheetData[key],
          translations: {},
          meta: {
            includeComments: args.comments,
            langCode: args.language,
            mergeLanguages: args.merge,
            filters: args.filters,
          },
        },
        extension
      );

      const sheets = await transformedSheetsPromise;

      sheets[key] = data;

      return transformedSheetsPromise;
    },
    Promise.resolve({})
  );

  for (const version of Object.keys(transformedSheets)) {
    info(`Spreadsheet with version ${version}   formatted.`);

    info(`Saving translations - version ${version}`);
    filesCreators.save(transformedSheets[version], args.path, args.filename, extension, version, args.base);

    info(`File (version ${version}) successfully saved.`);
  }
}

function saveNecessaryEnvToFile(inEnvStorage: InEnvStorage, authData: { [key: string]: string }) {
  const {
    BABELSHEET_CLIENT_ID,
    BABELSHEET_CLIENT_SECRET,
    BABELSHEET_SPREADSHEET_ID,
    BABELSHEET_SPREADSHEET_NAME,
  } = process.env;

  if (!authData.clientId || authData.clientId !== BABELSHEET_CLIENT_ID) {
    inEnvStorage.set('CLIENT_ID', authData.clientId || '');
  }

  if (!authData.clientSecret || authData.clientSecret !== BABELSHEET_CLIENT_SECRET) {
    inEnvStorage.set('CLIENT_SECRET', authData.clientSecret || '');
  }

  if (!authData.spreadsheetId || authData.spreadsheetId !== BABELSHEET_SPREADSHEET_ID) {
    inEnvStorage.set('SPREADSHEET_ID', authData.spreadsheetId || '');
  }

  if (authData.spreadsheetName !== BABELSHEET_SPREADSHEET_NAME) {
    inEnvStorage.set('SPREADSHEET_NAME', authData.spreadsheetName);
  }
}

function getAndSaveAuthData(
  logger: ILogger,
  inEnvStorage: InEnvStorage,
  args: Arguments,
  configProvider: ISpreadsheetConfigService
) {
  logger.info('Getting auth variables...');
  const spreadsheetAuthData = configProvider.getSpreadsheetConfig(args);

  saveNecessaryEnvToFile(inEnvStorage, spreadsheetAuthData);

  logger.info('Checking auth variables...');
  configProvider.validateConfig(spreadsheetAuthData);

  return spreadsheetAuthData;
}

async function getRefreshToken(
  googleAuth: GoogleAuth,
  { clientId, clientSecret, redirectUri }: { [key: string]: string }
) {
  const oAuth2Client = await googleAuth.createOAuthClient(clientId, clientSecret, redirectUri);

  const { refresh_token } = await googleAuth.getTokens(oAuth2Client);
  return refresh_token;
}

export async function generateConfigFile(
  logger: ILogger,
  inEnvStorage: InEnvStorage,
  googleAuth: GoogleAuth,
  args: Arguments,
  storage: IStorage,
  configProvider: ISpreadsheetConfigService
) {
  const spreadsheetAuthData = getAndSaveAuthData(logger, inEnvStorage, args, configProvider);

  logger.info('Acquiring refresh token...');
  const refreshToken = await getRefreshToken(googleAuth, spreadsheetAuthData);

  logger.info('Saving token...');
  storage.set('babelsheet_refresh_token', refreshToken);
  logger.info('Refresh token saved');
}
