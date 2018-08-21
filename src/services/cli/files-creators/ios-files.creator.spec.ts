import IosFilesCreator from './ios-files.creator';
import * as fs from 'fs';

jest.mock('fs');

const fileRepository = {
  hasAccess: (path, permission) => false,
  loadData: (filename, extension) => 'loadData',
  saveData: jest.fn(),
};

describe('FileCreators', () => {
  const iosFilesCreator = new IosFilesCreator(fileRepository);

  it('does return true if supported type', async () => {
    const result = iosFilesCreator.supports('strings');

    expect(result).toBeTruthy();
  });

  it('does return false if not supported type', async () => {
    const result = iosFilesCreator.supports('xyz');

    expect(result).toBeFalsy();
  });

  it('executes save method once when dataToSave is string', () => {
    iosFilesCreator.save('data', '.', 'test');

    expect(fileRepository.saveData).toBeCalledWith('data', 'test', 'strings', '.');
    expect(fileRepository.saveData.mock.calls.length).toBe(1);
  });

  it('executes save method for every language with proper language-region code', () => {
    const translations = [
      { lang: 'pl_pl', content: 'test2' },
      { lang: 'en_US', content: 'test' },
      { lang: 'de', content: 'test3' },
    ];
    iosFilesCreator.save(translations, '.', 'test');

    const firstPathName = './pl.lproj';
    const secondPathName = './en-US.lproj';
    const thirdPathName = `./${translations[2].lang}.lproj`;

    expect(fs.mkdirSync).toBeCalledWith(firstPathName);
    expect(fs.mkdirSync).toBeCalledWith(secondPathName);
    expect(fs.mkdirSync).toBeCalledWith(thirdPathName);
    expect(fileRepository.saveData).toBeCalledWith(translations[0].content, 'Localizable', 'strings', firstPathName);
    expect(fileRepository.saveData).toBeCalledWith(translations[1].content, 'Localizable', 'strings', secondPathName);
    expect(fileRepository.saveData).toBeCalledWith(translations[2].content, 'Localizable', 'strings', thirdPathName);
  });
});
