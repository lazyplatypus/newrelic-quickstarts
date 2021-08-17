'use strict';

/**
 *
 * @param {string} name
 * @returns
 */
const transformName = (name) => {
  // still need to handle parenthesis, slash -- (content), pub/sub

  return name
    .toLowerCase()
    .replace(/ *\([^)]*\) */g, '')
    .replaceAll('++', 'plusplus')
    .replaceAll('.net', 'dotnet')
    .replaceAll('::', '-')
    .replaceAll('.', '-')
    .replaceAll(' ', '-')
    .replaceAll('/', '-')
    .replaceAll('_', '-')
    .replace(/[^A-Za-z0-9-]/g, '');
};

const main = async () => {
  /**
   * 1. download data from api endpoint, or read from file (download manually).
   * 2. for each integration, create appropriately named & located directory.
   * 3. populate directory with config.yml & logo.
   * 4. populate config.yml with description, title, documentation, etc.
   */

  const migrations = require('./migrations.json');

  const temp = {};

  for (const migration of migrations) {
    temp[migration['PACK_NAME']] = {
      ...migration,
      PACK_NAME: transformName(migration['PACK_NAME']),
      PARENT_DIRECTORY: transformName(migration['PARENT_DIRECTORY']),
    };

    // temp[migration['PACK_NAME']] = { ...migration };
  }

  console.log(JSON.stringify(temp, null, 4));
};

main();
