const leoProfanity = require('leo-profanity');

// Charge les dictionnaires français et anglais
leoProfanity.loadDictionary('fr');
leoProfanity.add(leoProfanity.getDictionary('en'));

// Mots supplémentaires non couverts par les dictionnaires
leoProfanity.add([
  'salope', 'pute', 'connard', 'connasse', 'enculé', 'encule',
  'pd', 'fdp', 'ntm', 'nique', 'niquer', 'baise', 'baiser',
  'couille', 'couilles', 'bite', 'chatte', 'con', 'conne',
]);

/**
 * Vérifie si un ou plusieurs textes contiennent des mots vulgaires.
 * @param {...string} texts — les champs à vérifier
 * @returns {boolean} true si un mot vulgaire est détecté
 */
function containsProfanity(...texts) {
  return texts.some((text) => typeof text === 'string' && leoProfanity.check(text));
}

module.exports = { containsProfanity };
