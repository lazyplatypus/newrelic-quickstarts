'use strict';
const fse = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const fetch = require('node-fetch');

const getIntegrations = () => {
  const rawData = require('./integrations.json');
  return rawData['data']; // array of integrations
};

const formatName = (name) => {
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
    .replace(/ [^a-zA-Z0-9-]+ /g, '');
};

const formatDescription = (description) => {
  return description
    .replaceAll('<p>', '')
    .replaceAll('</p>', '');
};

/**
 *
 * @param {string} imageUrl
 */
const downloadImage = async (imageUrl) => {
  const response = await fetch(imageUrl);
  const buffer = await response.buffer();
  return buffer;
};

/**
 *
 * @param {string} integration
 * @param {string} dirPath
 */
const downloadImage2 = async (integration, dirPath) => {
  const imageUrl =
    integration?.relationships?.field_integration__logo?.data?.meta?.image_url;

  if (imageUrl) {
    const response = await fetch(imageUrl);
    const imageBuffer = await response.buffer();

    const imageExtension = path.extname(imageUrl);

    await fse.outputFile(
      path.join(dirPath, `logo${imageExtension}`),
      imageBuffer
    );

    console.log(`INFO: created ${path.join(dirPath, `logo${imageExtension}`)}`);

    await fse.outputFile(
      path.join(dirPath, `icon${imageExtension}`),
      imageBuffer
    );

    console.log(`INFO: created ${path.join(dirPath, `logo${imageExtension}`)}`);

    return {
      icon: `icon${imageExtension}`,
      logo: `logo${imageExtension}`,
    };
  } else {
    console.log('INFO: no image to download');

    // nothing to download
    return {
      icon: '',
      logo: '',
    };
  }
};

const main = async () => {
  /*
   * 1. download data from api endpoint, or read from file (download manually).
   * 2. for each integration, create appropriately named & located directory.
   * 3. populate directory with config.yml & logo.
   * 4. populate config.yml with description, title, documentation, etc.
   */
  const migrations = require('./migrations.2.json');

  const integrations = getIntegrations();

  for (const integration of integrations) {
    try {
      if (!integration.attributes.field_integration__docs_link) {
        console.log(
          `ERROR: ${integration.attributes.title} doesn't have documentation link`
        );
      } else {
        const migration = migrations[integration['attributes']['title']];

        let dirPath = '';

        if (migration['NEW_DEFINITION'] === 'TRUE') {
          if (migration['PACK_NAME'] === migration['PARENT_DIRECTORY']) {
            dirPath = path.join(
              '../../../packs',
              migration['PACK_NAME'].toLowerCase()
            );
          } else {
            // nested folder code path

            if (
              migration['PACK_NAME'] === 'oracle' ||
              migration['PACK_NAME'] === 'oracledb'
            ) {
              migration['PACK_NAME'] = 'oracle-database';
            }

            dirPath = path.join(
              '../../../packs',
              migration['PARENT_DIRECTORY'].toLowerCase(),
              migration['PACK_NAME'].toLowerCase()
            );
          }

          // create directory
          await fse.mkdirp(dirPath);
          console.log(`INFO: created ${dirPath}`);

          // download and save images
          const { icon, logo } = await downloadImage2(integration, dirPath);

          const configYaml = {
            name: formatName(`${integration.attributes.title}`),
            description: formatDescription(`${integration.attributes.field_integration__description}`),
            icon: icon,
            logo: logo,
            level: "Community",
            authors: ["New Relic"],
            title: `${integration.attributes.title}`,
            documentation: [{
              name: `${integration.attributes.title} installation docs`,
              description: formatDescription(`${integration.attributes.field_integration__description}`),
              url: `${integration.attributes.field_integration__docs_link}`,
            }],
          };

          // create config.yml
          const yamlString = yaml.dump(configYaml);

          await fse.outputFile(path.join(dirPath, 'config.yml'), yamlString);
          console.log(`INFO: created ${path.join(dirPath, 'config.yml')}`);
        } else {
          console.log(`INFO: skipping over ${migration.PACK_NAME}`);
        }
      }
    } catch (exception) {
      console.log(
        `ERROR: error occurred for ${integration.attributes.title}. caught: ${exception.stack}`
      );
    }
  }
};

main();
