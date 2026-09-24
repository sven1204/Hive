require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { attachDemoCovers } = require('./attachDemoCovers');
const { connectDB, closeDB } = require('../db');
const User            = require('../models/User');
const Project         = require('../models/Project');
const ProjectCover    = require('../models/ProjectCover');
const ProjectHistory  = require('../models/ProjectHistory');
const ProjectRequest  = require('../models/ProjectRequest');
const Conversation    = require('../models/Conversation');
const Message         = require('../models/Message');
const Notification    = require('../models/Notification');

const PASSWORD = 'Super2026';

// [email, firstName, lastName, displayName, city, country, avgScore, votes, skills, languages]
// avgScore is already the average (1.0–5.0), stored directly in reputation.score
const userSeeds = [
  // ─── Tech/Dev (0-4) ───
  ['lea.martin@hive-demo.com',        'Lea',      'Martin',    'LeaM',        'Genève',            'Suisse', 4.8, 5, ['JavaScript', 'React', 'Design'],              ['Français', 'Anglais']],
  ['noah.dupont@hive-demo.com',       'Noah',     'Dupont',    'NoahD',       'Lausanne',          'Suisse', 4.4, 5, ['Python', 'Arduino', 'STEM'],                   ['Français', 'Allemand']],
  ['maxime.leroy@hive-demo.com',      'Maxime',   'Leroy',     'MaximeL',     'Nantes',            'France', 5.0, 4, ['JavaScript', 'Node.js', 'React'],              ['Français', 'Anglais']],
  ['theo.lambert@hive-demo.com',      'Théo',     'Lambert',   'TheoL',       'Paris',             'France', 4.5, 4, ['Python', 'IA', 'Data'],                        ['Français', 'Anglais']],
  ['alice.morel@hive-demo.com',       'Alice',    'Morel',     'AliceM',      'Lyon',              'France', 4.2, 5, ['React', 'UI', 'Figma'],                        ['Français', 'Anglais']],
  // ─── Art/Design (5-9) ───
  ['sarah.muller@hive-demo.com',      'Sarah',    'Müller',    'SarahM',      'Bâle',              'Suisse', 4.2, 5, ['Design', 'Illustration', 'Figma'],             ['Français', 'Allemand', 'Anglais']],
  ['emma.bernard@hive-demo.com',      'Emma',     'Bernard',   'EmmaB',       'Lyon',              'France', 4.5, 4, ['Photo', 'Vidéo', 'Montage'],                   ['Français', 'Anglais']],
  ['clara.schmid@hive-demo.com',      'Clara',    'Schmid',    'ClaraS',      'Bâle',              'Suisse', 4.3, 4, ['Illustration', 'Dessin', 'Peinture'],          ['Français', 'Allemand']],
  ['margot.dubois@hive-demo.com',     'Margot',   'Dubois',    'MargotD',     'Paris',             'France', 4.8, 4, ['Photo', 'Vidéo', 'Montage'],                   ['Français', 'Anglais']],
  ['jules.petit@hive-demo.com',       'Jules',    'Petit',     'JulesP',      'Strasbourg',        'France', 4.7, 3, ['Dessin', 'Illustration', 'Art'],               ['Français', 'Allemand']],
  // ─── Musique (10-14) ───
  ['tom.vidal@hive-demo.com',         'Tom',      'Vidal',     'TomV',        'Berne',             'Suisse', 4.8, 4, ['Musique', 'Guitare', 'Composition'],           ['Français', 'Allemand']],
  ['lucie.favre@hive-demo.com',       'Lucie',    'Favre',     'LucieF',      'Yverdon-les-Bains', 'Suisse', 4.0, 4, ['Piano', 'Musique classique', 'Pédagogie'],     ['Français']],
  ['jade.perret@hive-demo.com',       'Jade',     'Perret',    'JadeP',       'Montreux',          'Suisse', 4.2, 5, ['Danse', 'Musique', 'Scène'],                   ['Français', 'Anglais']],
  ['baptiste.simon@hive-demo.com',    'Baptiste', 'Simon',     'BaptisteS',   'Bordeaux',          'France', 5.0, 4, ['Musique', 'Batterie', 'Composition'],          ['Français']],
  ['manon.richard@hive-demo.com',     'Manon',    'Richard',   'ManonR',      'Toulouse',          'France', 4.7, 3, ['Chant', 'Musique', 'Scène'],                   ['Français', 'Anglais']],
  // ─── Sport (15-19) ───
  ['hugo.faivre@hive-demo.com',       'Hugo',     'Faivre',    'HugoF',       'Sion',              'Suisse', 4.0, 4, ['Sport', 'Coaching', 'Plein air'],              ['Français']],
  ['axel.renard@hive-demo.com',       'Axel',     'Renard',    'AxelR',       'Bordeaux',          'France', 4.6, 5, ['Surf', 'Sport', 'Coaching'],                   ['Français', 'Anglais']],
  ['nathan.robert@hive-demo.com',     'Nathan',   'Robert',    'NathanR',     'Grenoble',          'France', 4.8, 4, ['Escalade', 'Trail', 'Outdoor'],                ['Français']],
  ['camille.roux@hive-demo.com',      'Camille',  'Roux',      'CamilleRx',   'Nice',              'France', 4.4, 5, ['Natation', 'Sport', 'Coaching'],               ['Français', 'Anglais']],
  ['pierre.garnier@hive-demo.com',    'Pierre',   'Garnier',   'PierreG',     'Lyon',              'France', 4.5, 4, ['Football', 'Sport', 'Coaching'],               ['Français']],
  // ─── Écologie (20-24) ───
  ['lucas.morel@hive-demo.com',       'Lucas',    'Morel',     'LucasM',      'Annecy',            'France', 4.0, 5, ['Écologie', 'Énergie', 'Recherche'],            ['Français']],
  ['zoe.girard@hive-demo.com',        'Zoe',      'Girard',    'ZoeG',        'Fribourg',          'Suisse', 4.3, 4, ['Couture', 'DIY', 'Art'],                       ['Français', 'Allemand']],
  ['elise.bonneau@hive-demo.com',     'Élise',    'Bonneau',   'EliseB',      'Montpellier',       'France', 5.0, 4, ['Écologie', 'Jardin', 'Biologie'],              ['Français']],
  ['victor.mounier@hive-demo.com',    'Victor',   'Mounier',   'VictorM',     'Rennes',            'France', 4.7, 3, ['Environnement', 'Recherche', 'Biologie'],      ['Français', 'Anglais']],
  ['chloe.lemaire@hive-demo.com',     'Chloé',    'Lemaire',   'ChloeL',      'Grenoble',          'France', 4.8, 4, ['Écologie', 'Randonnée', 'Nature'],             ['Français']],
  // ─── Théâtre/Danse (25-29) ───
  ['antoine.dumont@hive-demo.com',    'Antoine',  'Dumont',    'AntoineD',    'Marseille',         'France', 5.0, 5, ['Théâtre', 'Écriture', 'Mise en scène'],        ['Français', 'Anglais']],
  ['pauline.mercier@hive-demo.com',   'Pauline',  'Mercier',   'PaulineM',    'Paris',             'France', 4.2, 5, ['Théâtre', 'Danse', 'Scène'],                   ['Français', 'Anglais']],
  ['raphael.chevalier@hive-demo.com', 'Raphaël',  'Chevalier', 'RaphaelC',   'Toulouse',           'France', 4.5, 4, ['Théâtre', 'Improvisation', 'Écriture'],        ['Français']],
  ['oceane.bertrand@hive-demo.com',   'Océane',   'Bertrand',  'OceaneB',     'Nantes',            'France', 5.0, 4, ['Danse', 'Chorégraphie', 'Scène'],              ['Français', 'Anglais']],
  ['florian.david@hive-demo.com',     'Florian',  'David',     'FlorianD',    'Bordeaux',          'France', 4.7, 3, ['Danse', 'Hip-hop', 'Scène'],                   ['Français']],
  // ─── Social/Bénévolat (30-34) ───
  ['liam.cottet@hive-demo.com',       'Liam',     'Cottet',    'LiamC',       'Morges',            'Suisse', 3.8, 4, ['Organisation', 'Bénévolat', 'Lien social'],    ['Français']],
  ['adam.rochat@hive-demo.com',       'Adam',     'Rochat',    'AdamR',       'Neuchâtel',         'Suisse', 4.6, 5, ['Échecs', 'Stratégie', 'Tournoi'],              ['Français', 'Anglais']],
  ['sophie.garcia@hive-demo.com',     'Sophie',   'Garcia',    'SophieG',     'Marseille',         'France', 4.4, 5, ['Solidarité', 'Bénévolat', 'Social'],           ['Français', 'Anglais']],
  ['martin.thomas@hive-demo.com',     'Martin',   'Thomas',    'MartinT',     'Paris',             'France', 4.8, 4, ['Organisation', 'Événementiel', 'Communication'],['Français', 'Anglais']],
  ['julie.robin@hive-demo.com',       'Julie',    'Robin',     'JulieR',      'Lille',             'France', 4.3, 3, ['Bénévolat', 'Aide sociale', 'Lien social'],    ['Français']],
  // ─── Cuisine/Food (35-39) ───
  ['claire.dupuis@hive-demo.com',     'Claire',   'Dupuis',    'ClaireD',     'Lyon',              'France', 5.0, 4, ['Cuisine', 'Pâtisserie', 'Food'],               ['Français', 'Anglais']],
  ['yann.pages@hive-demo.com',        'Yann',     'Pages',     'YannP',       'Bordeaux',          'France', 4.2, 5, ['Cuisine', 'Oenologie', 'Gastronomie'],         ['Français', 'Anglais']],
  ['laura.michaud@hive-demo.com',     'Laura',    'Michaud',   'LauraM',      'Paris',             'France', 4.7, 3, ['Cuisine', 'Nutrition', 'Food'],                ['Français']],
  ['ethan.gros@hive-demo.com',        'Ethan',    'Gros',      'EthanG',      'Genève',            'Suisse', 4.8, 4, ['Cuisine', 'Pâtisserie', 'Organisation'],       ['Français', 'Anglais']],
  ['camille.fontaine@hive-demo.com',  'Camille',  'Fontaine',  'CamilleF',    'Grenoble',          'France', 5.0, 4, ['Marketing', 'Cuisine', 'Communication'],       ['Français', 'Anglais']],
  // ─── Médias/Podcast (40-44) ───
  ['mila.rey@hive-demo.com',          'Mila',     'Rey',       'MilaR',       'Nyon',              'Suisse', 3.8, 5, ['Podcast', 'Écriture', 'Médias'],               ['Français', 'Anglais']],
  ['quentin.martin@hive-demo.com',    'Quentin',  'Martin',    'QuentinM',    'Paris',             'France', 4.4, 5, ['Journalisme', 'Podcast', 'Écriture'],          ['Français', 'Anglais']],
  ['amelie.faure@hive-demo.com',      'Amélie',   'Faure',     'AmelieF',     'Strasbourg',        'France', 4.7, 3, ['Écriture', 'Blog', 'Médias'],                  ['Français', 'Allemand']],
  ['damien.lefebvre@hive-demo.com',   'Damien',   'Lefebvre',  'DamienL',     'Nantes',            'France', 5.0, 4, ['Podcast', 'Audio', 'Production'],              ['Français']],
  ['noemi.bourgeois@hive-demo.com',   'Noémie',   'Bourgeois', 'NoemiB',      'Lausanne',          'Suisse', 5.0, 4, ['Écriture', 'Blog', 'Communication'],           ['Français', 'Anglais']],
  // ─── STEM/Robotique (45-49) ───
  ['gabriel.perrin@hive-demo.com',    'Gabriel',  'Perrin',    'GabrielP',    'Lausanne',          'Suisse', 4.6, 5, ['Arduino', 'Électronique', 'STEM'],             ['Français', 'Anglais']],
  ['valentin.morin@hive-demo.com',    'Valentin', 'Morin',     'ValentinM',   'Lyon',              'France', 4.8, 4, ['Robotique', 'STEM', 'Python'],                 ['Français']],
  ['estelle.henry@hive-demo.com',     'Estelle',  'Henry',     'EstelleH',    'Grenoble',          'France', 5.0, 4, ['IA', 'Data', 'Python'],                        ['Français', 'Anglais']],
  ['clement.rousseau@hive-demo.com',  'Clément',  'Rousseau',  'ClementR',    'Paris',             'France', 4.4, 5, ['Dev', 'Web', 'JavaScript'],                    ['Français', 'Anglais']],
  ['ines.blanc@hive-demo.com',        'Inès',     'Blanc',     'InesB',       'Strasbourg',        'France', 4.5, 4, ['Architecture', 'Urbanisme', 'Dessin'],         ['Français', 'Allemand']],
  // ─── Outdoor/Randonnée (50-54) ───
  ['romain.tissot@hive-demo.com',     'Romain',   'Tissot',    'RomainT',     'Thonon-les-Bains',  'France', 5.0, 4, ['Voile', 'Sport nautique', 'Organisation'],     ['Français']],
  ['thomas.remy@hive-demo.com',       'Thomas',   'Remy',      'ThomasR',     'Annecy',            'France', 4.2, 5, ['Randonnée', 'Escalade', 'Outdoor'],            ['Français']],
  ['marion.pellerin@hive-demo.com',   'Marion',   'Pellerin',  'MarionP',     'Grenoble',          'France', 4.5, 4, ['Ski', 'Randonnée', 'Nature'],                  ['Français', 'Anglais']],
  ['arthur.guerin@hive-demo.com',     'Arthur',   'Guerin',    'ArthurG',     'Sion',              'Suisse', 5.0, 4, ['Ski', 'Alpinisme', 'Sport'],                   ['Français', 'Allemand']],
  ['juliette.baron@hive-demo.com',    'Juliette', 'Baron',     'JulietteB',   'Berne',             'Suisse', 4.7, 3, ['Cyclisme', 'Randonnée', 'Nature'],             ['Français', 'Allemand']],
  // ─── Jeux/E-sport (55-59) ───
  ['nicolas.gillet@hive-demo.com',    'Nicolas',  'Gillet',    'NicolasG',    'Paris',             'France', 5.0, 4, ['E-sport', 'Jeux', 'Stratégie'],               ['Français', 'Anglais']],
  ['mathieu.simon@hive-demo.com',     'Mathieu',  'Simon',     'MathieuS',    'Lyon',              'France', 4.7, 3, ['Jeux', 'Stratégie', 'Organisation'],           ['Français']],
  ['marie.thibaut@hive-demo.com',     'Marie',    'Thibaut',   'MarieT',      'Lausanne',          'Suisse', 4.4, 5, ['Jeux de rôle', 'Écriture', 'Communauté'],      ['Français', 'Anglais']],
  ['paul.morel@hive-demo.com',        'Paul',     'Morel',     'PaulM',       'Bordeaux',          'France', 5.0, 3, ['E-sport', 'Jeux', 'Streaming'],               ['Français', 'Anglais']],
  ['alexis.brun@hive-demo.com',       'Alexis',   'Brun',      'AlexisB',     'Montpellier',       'France', 5.0, 4, ['Échecs', 'Stratégie', 'Tournoi'],              ['Français']],
  // ─── Santé/Bien-être (60-64) ───
  ['celine.arnaud@hive-demo.com',     'Céline',   'Arnaud',    'CelineA',     'Nice',              'France', 4.6, 5, ['Yoga', 'Méditation', 'Bien-être'],             ['Français', 'Anglais']],
  ['laure.martin@hive-demo.com',      'Laure',    'Martin',    'LaureM',      'Lausanne',          'Suisse', 5.0, 4, ['Yoga', 'Pilates', 'Coaching'],                 ['Français', 'Anglais']],
  ['sebastien.faure@hive-demo.com',   'Sébastien','Faure',     'SebF',        'Paris',             'France', 4.8, 4, ['Fitness', 'Nutrition', 'Sport'],               ['Français']],
  ['anne.leclerc@hive-demo.com',      'Anne',     'Leclerc',   'AnneL',       'Grenoble',          'France', 4.4, 5, ['Natation', 'Fitness', 'Yoga'],                 ['Français', 'Anglais']],
  ['xavier.moreau@hive-demo.com',     'Xavier',   'Moreau',    'XavierM',     'Nantes',            'France', 4.7, 3, ['Sport', 'Fitness', 'Coaching'],                ['Français']],
  // ─── Architecture/Urbanisme (65-69) ───
  ['guillaume.perrot@hive-demo.com',  'Guillaume','Perrot',    'GuillaumeP',  'Paris',             'France', 4.8, 5, ['Architecture', 'Urbanisme', 'Dessin'],         ['Français', 'Anglais']],
  ['olivia.blanc@hive-demo.com',      'Olivia',   'Blanc',     'OliviaB',     'Strasbourg',        'France', 5.0, 4, ['Architecture', 'Design', 'Dessin'],            ['Français', 'Allemand']],
  ['eric.lambert@hive-demo.com',      'Eric',     'Lambert',   'EricL',       'Lyon',              'France', 4.7, 3, ['Urbanisme', 'Architecture', 'Patrimoine'],     ['Français']],
  ['charlotte.dupont@hive-demo.com',  'Charlotte','Dupont',    'CharlotteD',  'Marseille',         'France', 5.0, 4, ['Architecture', 'Patrimoine', 'Culture'],       ['Français', 'Anglais']],
  ['francois.blanc@hive-demo.com',    'François', 'Blanc',     'FrancoisB',   'Lyon',              'France', 4.4, 5, ['Cuisine', 'Gastronomie', 'Organisation'],      ['Français', 'Anglais']],
  // ─── Divers (70-79) ───
  ['anais.dupuy@hive-demo.com',       'Anaïs',    'Dupuy',     'AnaisD',      'Montpellier',       'France', 4.3, 3, ['Pâtisserie', 'Cuisine', 'Food'],               ['Français']],
  ['olivier.henry@hive-demo.com',     'Olivier',  'Henry',     'OlivierH',    'Bordeaux',          'France', 5.0, 4, ['Cuisine', 'Oenologie', 'Food'],                ['Français', 'Anglais']],
  ['charline.robert@hive-demo.com',   'Charline', 'Robert',    'CharlineR',   'Genève',            'Suisse', 4.8, 4, ['Communauté', 'Événementiel', 'Social'],        ['Français', 'Anglais']],
  ['remi.lefort@hive-demo.com',       'Rémi',     'Lefort',    'RemiL',       'Paris',             'France', 4.2, 5, ['Bénévolat', 'Organisation', 'Social'],         ['Français']],
  ['lucie.gautier@hive-demo.com',     'Lucie',    'Gautier',   'LucieG',      'Nantes',            'France', 5.0, 4, ['Communauté', 'Communication', 'Médias'],       ['Français', 'Anglais']],
  ['jean.briand@hive-demo.com',       'Jean',     'Briand',    'JeanB',       'Rennes',            'France', 4.3, 3, ['Bénévolat', 'Social', 'Organisation'],         ['Français']],
  ['noemie.perrin@hive-demo.com',     'Noémie',   'Perrin',    'NoemieP',     'Montpellier',       'France', 5.0, 4, ['Design', 'Photo', 'Art'],                      ['Français', 'Anglais']],
  ['benoit.caron@hive-demo.com',      'Benoît',   'Caron',     'BenoitC',     'Rennes',            'France', 4.3, 3, ['Football', 'Sport', 'Coaching'],               ['Français']],
  ['amelie.gros@hive-demo.com',       'Amélie',   'Gros',      'AmelieG',     'Nice',              'France', 5.0, 4, ['Illustration', 'Art', 'Design'],               ['Français', 'Anglais']],
  ['thomas.gilles@hive-demo.com',     'Thomas',   'Gilles',    'ThomasG',     'Zurich',            'Suisse', 4.4, 5, ['Dev', 'JavaScript', 'React'],                  ['Français', 'Allemand', 'Anglais']],
  // ─── Nouveaux utilisateurs (80-99) ───
  ['lea.dupont@hive-demo.com',        'Léa',      'Dupont',    'LeaD',        'Paris',             'France', 4.5, 4, ['Design', 'UI', 'Figma'],                       ['Français', 'Anglais']],
  ['hugo.martin@hive-demo.com',       'Hugo',     'Martin',    'HugoM',       'Lyon',              'France', 4.2, 3, ['Dev', 'Python', 'IA'],                         ['Français']],
  ['emma.klein@hive-demo.com',        'Emma',     'Klein',     'EmmaK',       'Strasbourg',        'France', 4.8, 5, ['Musique', 'Chant', 'Composition'],             ['Français', 'Allemand']],
  ['lucas.bernard@hive-demo.com',     'Lucas',    'Bernard',   'LucasB',      'Bordeaux',          'France', 4.3, 4, ['Sport', 'Running', 'Outdoor'],                 ['Français']],
  ['sofia.rossi@hive-demo.com',       'Sofia',    'Rossi',     'SofiaR',      'Genève',            'Suisse', 5.0, 3, ['Danse', 'Scène', 'Chorégraphie'],              ['Français', 'Anglais', 'Italien']],
  ['ethan.dubois@hive-demo.com',      'Ethan',    'Dubois',    'EthanD',      'Toulouse',          'France', 4.6, 4, ['Photographie', 'Vidéo', 'Montage'],            ['Français', 'Anglais']],
  ['chloe.simon@hive-demo.com',       'Chloé',    'Simon',     'ChloeS',      'Nantes',            'France', 4.4, 5, ['Bénévolat', 'Social', 'Communication'],        ['Français']],
  ['maxime.petit@hive-demo.com',      'Maxime',   'Petit',     'MaximeP',     'Marseille',         'France', 4.9, 4, ['Cuisine', 'Gastronomie', 'Pâtisserie'],        ['Français', 'Anglais']],
  ['alice.wagner@hive-demo.com',      'Alice',    'Wagner',    'AliceW',      'Bâle',              'Suisse', 4.1, 3, ['Arduino', 'Électronique', 'STEM'],             ['Français', 'Allemand']],
  ['mathieu.leroy@hive-demo.com',     'Mathieu',  'Leroy',     'MathieuL',    'Grenoble',          'France', 4.7, 5, ['Escalade', 'Alpinisme', 'Outdoor'],            ['Français']],
  ['julie.moreau@hive-demo.com',      'Julie',    'Moreau',    'JulieM',      'Lausanne',          'Suisse', 4.5, 4, ['Yoga', 'Pilates', 'Bien-être'],                ['Français', 'Anglais']],
  ['pierre.favre@hive-demo.com',      'Pierre',   'Favre',     'PierreF',     'Berne',             'Suisse', 4.3, 3, ['Podcast', 'Médias', 'Communication'],          ['Français', 'Allemand']],
  ['sarah.renard@hive-demo.com',      'Sarah',    'Renard',    'SarahR',      'Montpellier',       'France', 4.8, 5, ['Illustration', 'Dessin', 'Art'],               ['Français', 'Anglais']],
  ['antoine.blanc@hive-demo.com',     'Antoine',  'Blanc',     'AntoineB',    'Rennes',            'France', 4.2, 4, ['Dev', 'Node.js', 'Web'],                       ['Français', 'Anglais']],
  ['marine.perrot@hive-demo.com',     'Marine',   'Perrot',    'MarineP',     'Nice',              'France', 5.0, 3, ['Natation', 'Sport', 'Coaching'],               ['Français']],
  ['clement.henry@hive-demo.com',     'Clément',  'Henry',     'ClementH',    'Paris',             'France', 4.6, 4, ['Théâtre', 'Scène', 'Écriture'],               ['Français', 'Anglais']],
  ['zoe.muller@hive-demo.com',        'Zoé',      'Müller',    'ZoeM',        'Genève',            'Suisse', 4.4, 5, ['Écologie', 'Jardin', 'Nature'],                ['Français', 'Allemand']],
  ['romain.garcia@hive-demo.com',     'Romain',   'Garcia',    'RomainG',     'Bordeaux',          'France', 4.7, 4, ['Football', 'Sport', 'Organisation'],           ['Français']],
  ['emma.tissot@hive-demo.com',       'Emma',     'Tissot',    'EmmaT',       'Lyon',              'France', 4.5, 3, ['Jeux de rôle', 'Écriture', 'Communauté'],      ['Français', 'Anglais']],
  ['leo.bonnet@hive-demo.com',        'Léo',      'Bonnet',    'LeoB',        'Zurich',            'Suisse', 4.9, 5, ['Data', 'IA', 'Python'],                        ['Français', 'Allemand', 'Anglais']],
];

// [title, description, city, country, coordinates[lon,lat], minAge, maxAge, tags, status, skills]
// Each user gets 2 projects: projectSeeds[i*2] and projectSeeds[i*2+1]
const projectSeeds = [
  // === USER 0 — LeaM (Genève) ===
  ['Hackathon IA Genève',             'Hackathon 48h autour de l intelligence artificielle et du ML.',                         'Genève',            'Suisse', [6.1432, 46.2044], 18, null, ['IA', 'Hackathon', 'Dev'],             'open',     ['Python', 'IA']],
  ['Workshop React Genève',           'Atelier pratique pour apprendre React en construisant une app.',                         'Genève',            'Suisse', [6.1380, 46.2010], 17, null, ['Dev', 'React', 'JavaScript'],         'closed',   ['React', 'JavaScript']],
  // === USER 1 — NoahD (Lausanne) ===
  ['Atelier robotique ados',          'Construction de robots et initiation Arduino pour adolescents.',                         'Lausanne',          'Suisse', [6.6323, 46.5197], 12, 17,   ['Robotique', 'Arduino', 'STEM'],       'open',     ['Arduino', 'STEM']],
  ['Initiation Python Lausanne',      'Atelier hebdomadaire pour apprendre Python sans expérience.',                           'Lausanne',          'Suisse', [6.6380, 46.5240], 14, null, ['Python', 'Dev', 'STEM'],              'closed',   ['Python', 'Pédagogie']],
  // === USER 2 — MaximeL (Nantes) ===
  ['Plateforme entraide étudiants',   'Dev d une app web de mise en relation pour l entraide scolaire.',                        'Nantes',            'France', [-1.5534, 47.2184], 17, null, ['Dev', 'Web', 'Éducation'],            'open',     ['JavaScript', 'React']],
  ['Hackathon inclusion numérique',   'Hackathon 24h pour créer un prototype autour de l inclusion.',                           'Nantes',            'France', [-1.5580, 47.2150], 18, null, ['Hackathon', 'Dev', 'Social'],         'closed',   ['JavaScript', 'Node.js']],
  // === USER 3 — TheoL (Paris) ===
  ['Projet IA santé Paris',           'Développement d un algorithme d aide au diagnostic basé sur le ML.',                     'Paris',             'France', [2.3522, 48.8566], 18, null, ['IA', 'Data', 'Dev'],                  'open',     ['Python', 'IA']],
  ['Data viz citoyenne Paris',        'Visualisation de données publiques sur la qualité de l air.',                            'Paris',             'France', [2.3480, 48.8600], 17, null, ['Data', 'Dev', 'Web'],                 'closed',   ['Python', 'Data']],
  // === USER 4 — AliceM (Lyon) ===
  ['Design system open source',       'Design system accessible et open source pour projets associatifs.',                      'Lyon',              'France', [4.8357, 45.7640], 18, null, ['Design', 'Dev', 'UI'],                'open',     ['Design', 'Figma']],
  ['Workshop Figma débutants Lyon',   'Initiation pratique à Figma pour concevoir des interfaces simples.',                     'Lyon',              'France', [4.8320, 45.7700], 17, null, ['Design', 'UI', 'Figma'],              'closed',   ['Design', 'Figma']],
  // === USER 5 — SarahM (Bâle) ===
  ['Zine illustré Bâle',              'Création collective d un zine illustré sur la culture underground bâloise.',             'Bâle',              'Suisse', [7.5886, 47.5596], 16, null, ['Illustration', 'Art', 'Zine'],        'open',     ['Design', 'Illustration']],
  ['Expo design émergent Bâle',       'Exposition de designers indépendants de Bâle et environs.',                             'Bâle',              'Suisse', [7.5920, 47.5570], 18, null, ['Design', 'Art', 'Exposition'],        'closed',   ['Design', 'Illustration']],
  // === USER 6 — EmmaB (Lyon) ===
  ['Collectif photo urbaine Lyon',    'Sorties photo mensuelles et expositions collaboratives en ville.',                       'Lyon',              'France', [4.8250, 45.7720], 18, null, ['Photo', 'Art', 'Exposition'],         'open',     ['Photo', 'Montage']],
  ['Mini-doc artisans lyonnais',      'Court documentaire sur les artisans de la Croix-Rousse.',                               'Lyon',              'France', [4.8320, 45.7700], 18, null, ['Vidéo', 'Documentaire', 'Art'],       'closed',   ['Vidéo', 'Montage']],
  // === USER 7 — ClaraS (Bâle) ===
  ['Atelier peinture adultes Bâle',   'Cours hebdomadaires de peinture acrylique pour adultes.',                               'Bâle',              'Suisse', [7.5900, 47.5610], 18, null, ['Peinture', 'Art', 'Atelier'],         'open',     ['Peinture', 'Dessin']],
  ['Illustration livre jeunesse',     'Illustration d un livre jeunesse collectif par des illustrateurs locaux.',              'Bâle',              'Suisse', [7.5870, 47.5580], 20, null, ['Illustration', 'Art', 'Dessin'],      'closed',   ['Illustration', 'Dessin']],
  // === USER 8 — MargotD (Paris) ===
  ['Atelier photo portrait Paris',    'Ateliers hebdomadaires autour de la photographie de portrait.',                         'Paris',             'France', [2.3380, 48.8720], 17, null, ['Photo', 'Art', 'Portrait'],           'open',     ['Photo', 'Montage']],
  ['Websérie documentaire Paris',     'Websérie documentaire sur les artistes parisiens émergents.',                           'Paris',             'France', [2.3480, 48.8600], 18, null, ['Vidéo', 'Documentaire', 'Médias'],    'closed',   ['Vidéo', 'Montage']],
  // === USER 9 — JulesP (Strasbourg) ===
  ['Fresque murale Strasbourg',       'Fresque murale participative dans le quartier Hautepierre.',                            'Strasbourg',        'France', [7.7521, 48.5734], 16, null, ['Art', 'Peinture', 'Communauté'],      'open',     ['Dessin', 'Peinture']],
  ['Atelier sérigraphie Strasbourg',  'Initiation à la sérigraphie et création de tirages limités.',                           'Strasbourg',        'France', [7.7480, 48.5760], 16, null, ['Art', 'Illustration', 'DIY'],         'closed',   ['Dessin', 'DIY']],
  // === USER 10 — TomV (Berne) ===
  ['Open mic mensuel Berne',          'Scène ouverte mensuelle pour musiciens amateurs.',                                      'Berne',             'Suisse', [7.4458, 46.9480], 15, null, ['Musique', 'Scène', 'Live'],           'open',     ['Musique', 'Scène']],
  ['Album collectif indie Berne',     'Co-création d un album de 8 titres entre musiciens bernois.',                           'Berne',             'Suisse', [7.4490, 46.9510], 18, null, ['Musique', 'Composition', 'Studio'],   'closed',   ['Musique', 'Composition']],
  // === USER 11 — LucieF (Yverdon) ===
  ['Atelier piano débutants Yverdon', 'Cours collectifs hebdomadaires pour adultes débutants.',                                'Yverdon-les-Bains', 'Suisse', [6.6413, 46.7785], 16, null, ['Piano', 'Musique', 'Atelier'],        'open',     ['Piano', 'Pédagogie']],
  ['Concert de fin d année Yverdon',  'Concert public regroupant les élèves de l atelier piano.',                              'Yverdon-les-Bains', 'Suisse', [6.6440, 46.7800], 16, null, ['Musique', 'Concert', 'Scène'],        'closed',   ['Piano', 'Scène']],
  // === USER 12 — JadeP (Montreux) ===
  ['Cours danse street Montreux',     'Sessions ouvertes pour niveau débutant à intermédiaire.',                               'Montreux',          'Suisse', [6.9107, 46.4312], 14, 22,   ['Danse', 'Musique', 'Street'],         'open',     ['Danse', 'Scène']],
  ['Showcase Montreux Jazz',          'Préparation d une chorégraphie collective pour le festival.',                           'Montreux',          'Suisse', [6.9150, 46.4290], 16, null, ['Danse', 'Musique', 'Festival'],       'closed',   ['Danse', 'Scène']],
  // === USER 13 — BaptisteS (Bordeaux) ===
  ['Jam session jazz Bordeaux',       'Sessions de jam hebdomadaires ouvertes à tous les niveaux.',                            'Bordeaux',          'France', [-0.5792, 44.8378], 16, null, ['Musique', 'Jazz', 'Live'],            'open',     ['Musique', 'Composition']],
  ['EP collectif indie Bordeaux',     'Production d un EP de 5 titres entre musiciens bordelais.',                             'Bordeaux',          'France', [-0.5850, 44.8340], 18, null, ['Musique', 'Studio', 'Composition'],   'closed',   ['Musique', 'Composition']],
  // === USER 14 — ManonR (Toulouse) ===
  ['Chorale pop Toulouse',            'Chorale non classique ouverte à tous, répétitions bihebdomadaires.',                    'Toulouse',          'France', [1.4442, 43.6047], 17, null, ['Musique', 'Chant', 'Scène'],          'open',     ['Musique', 'Scène']],
  ['Atelier chant lyrique Toulouse',  'Cours collectifs de chant classique animés par une chanteuse pro.',                     'Toulouse',          'France', [1.4490, 43.6080], 18, null, ['Musique', 'Chant', 'Classique'],      'closed',   ['Musique', 'Scène']],
  // === USER 15 — HugoF (Sion) ===
  ['Initiation volley plage Sion',    'Entraînements en petit groupe sur les rives du Rhône.',                                 'Sion',              'Suisse', [7.3606, 46.2331], 14, 19,   ['Volley', 'Sport', 'Plage'],           'open',     ['Sport', 'Coaching']],
  ['Trail Valère entraînement',       'Programme de préparation au trail urbain autour de Sion.',                              'Sion',              'Suisse', [7.3580, 46.2350], 16, null, ['Trail', 'Sport', 'Running'],          'closed',   ['Sport', 'Plein air']],
  // === USER 16 — AxelR (Bordeaux) ===
  ['École de surf junior Bordeaux',   'Initiation au surf pour les 10-16 ans sur le bassin d Arcachon.',                      'Bordeaux',          'France', [-0.5650, 44.8450], 10, 16,   ['Surf', 'Sport', 'Jeunesse'],          'open',     ['Surf', 'Coaching']],
  ['Tournoi beach-volley été',        'Tournoi estival en 2v2 sur les plages de Lacanau.',                                    'Bordeaux',          'France', [-0.5850, 44.8340], 15, null, ['Volley', 'Sport', 'Plage'],           'closed',   ['Sport', 'Organisation']],
  // === USER 17 — NathanR (Grenoble) ===
  ['Club escalade Grenoble',          'Initiation à l escalade en salle et sorties falaise.',                                  'Grenoble',          'France', [5.7245, 45.1885], 16, null, ['Escalade', 'Sport', 'Outdoor'],       'open',     ['Sport', 'Outdoor']],
  ['Trail Belledonne prépa',          'Groupe d entraînement pour préparer le trail de Belledonne.',                           'Grenoble',          'France', [5.7280, 45.1920], 18, null, ['Trail', 'Running', 'Sport'],          'open',     ['Sport', 'Plein air']],
  // === USER 18 — CamilleRx (Nice) ===
  ['Club natation adultes Nice',      'Séances de natation hebdomadaires pour adultes, tous niveaux.',                         'Nice',              'France', [7.2620, 43.7102], 18, null, ['Natation', 'Sport', 'Fitness'],       'open',     ['Sport', 'Coaching']],
  ['Yoga en plein air Nice',          'Séances de yoga matinal sur la Promenade des Anglais.',                                 'Nice',              'France', [7.2580, 43.7120], 16, null, ['Yoga', 'Sport', 'Bien-être'],         'open',     ['Yoga', 'Coaching']],
  // === USER 19 — PierreG (Lyon) ===
  ['Club foot junior Lyon',           'Matchs et entraînements tous les dimanches pour les jeunes.',                           'Lyon',              'France', [4.8480, 45.7560], 10, 18,   ['Football', 'Sport', 'Jeunesse'],      'open',     ['Football', 'Coaching']],
  ['Basket 3v3 Confluence Lyon',      'Tournoi de basket 3v3 mensuel sur les terrains du quartier.',                           'Lyon',              'France', [4.8300, 45.7500], 15, 30,   ['Basket', 'Sport', 'Tournoi'],         'open',     ['Sport', 'Organisation']],
  // === USER 20 — LucasM (Annecy) ===
  ['Hackathon climat Annecy',         'Équipe pour prototyper des idées de transition écologique.',                            'Annecy',            'France', [6.1294, 45.8992], 18, null, ['Hackathon', 'Climat', 'Écologie'],    'open',     ['Écologie', 'Dev']],
  ['Atelier énergie renouvelable',    'Ateliers pratiques sur les énergies solaire et éolienne.',                              'Annecy',            'France', [6.1250, 45.9020], 16, null, ['Énergie', 'Écologie', 'STEM'],        'open',     ['Écologie', 'Recherche']],
  // === USER 21 — ZoeG (Fribourg) ===
  ['Atelier couture solidaire',       'Réparation de vêtements avec des tissus recyclés.',                                    'Fribourg',          'Suisse', [7.1591, 46.8065], 16, null, ['Couture', 'DIY', 'Solidaire'],        'open',     ['Couture', 'DIY']],
  ['Upcycling mode Fribourg',         'Transformer des vêtements usagés en pièces uniques.',                                  'Fribourg',          'Suisse', [7.1620, 46.8040], 14, null, ['Couture', 'DIY', 'Art'],              'open',     ['Couture', 'DIY']],
  // === USER 22 — EliseB (Montpellier) ===
  ['Jardin partagé Montpellier',      'Création d un jardin communautaire à vocation pédagogique.',                           'Montpellier',       'France', [3.8767, 43.6117], 16, null, ['Jardin', 'Écologie', 'Communauté'],   'open',     ['Écologie', 'Jardin']],
  ['Compostage urbain Montpellier',   'Mise en place de points de compostage dans les quartiers.',                             'Montpellier',       'France', [3.8820, 43.6090], 15, null, ['Écologie', 'Communauté', 'Jardin'],   'open',     ['Écologie', 'Organisation']],
  // === USER 23 — VictorM (Rennes) ===
  ['Inventaire biodiversité Rennes',  'Recensement participatif de la faune et flore dans les parcs.',                        'Rennes',            'France', [-1.6778, 48.1173], 15, null, ['Biodiversité', 'Écologie', 'Science'],'open',    ['Biologie', 'Recherche']],
  ['Nettoyage plages Bretagne',       'Opérations de nettoyage des plages de la côte bretonne.',                              'Rennes',            'France', [-1.6850, 48.1100], 16, null, ['Écologie', 'Bénévolat', 'Nature'],    'open',     ['Écologie', 'Organisation']],
  // === USER 24 — ChloeL (Grenoble) ===
  ['Fresque du Climat Grenoble',      'Atelier collaboratif de sensibilisation au changement climatique.',                    'Grenoble',          'France', [5.7350, 45.1950], 15, null, ['Climat', 'Écologie', 'Éducation'],    'open',     ['Écologie', 'Pédagogie']],
  ['Randonnée zéro déchet Chartreuse','Sorties nature avec collecte des déchets abandonnés.',                                 'Grenoble',          'France', [5.7200, 45.2100], 14, null, ['Randonnée', 'Écologie', 'Outdoor'],   'open',     ['Écologie', 'Plein air']],
  // === USER 25 — AntoineD (Marseille) ===
  ['Compagnie théâtre Marseille',     'Création de pièces jouées dans les centres culturels.',                                'Marseille',         'France', [5.3698, 43.2965], 16, null, ['Théâtre', 'Scène', 'Culture'],        'open',     ['Théâtre', 'Mise en scène']],
  ['Festival théâtre de rue Marseille','Préparation de spectacles pour le festival théâtre de rue.',                          'Marseille',         'France', [5.3750, 43.2940], 18, null, ['Théâtre', 'Scène', 'Festival'],       'open',     ['Théâtre', 'Mise en scène']],
  // === USER 26 — PaulineM (Paris) ===
  ['Atelier improvisation Paris',     'Cours hebdomadaires d improvisation théâtrale pour adultes.',                          'Paris',             'France', [2.3700, 48.8530], 18, null, ['Théâtre', 'Improvisation', 'Scène'], 'open',     ['Théâtre', 'Improvisation']],
  ['Mise en scène contemporaine',     'Création collective d une pièce théâtrale contemporaine.',                             'Paris',             'France', [2.3680, 48.8560], 20, null, ['Théâtre', 'Scène', 'Écriture'],       'open',     ['Théâtre', 'Mise en scène']],
  // === USER 27 — RaphaelC (Toulouse) ===
  ['Atelier écriture dramatique',     'Écrire des pièces courtes et les mettre en scène.',                                    'Toulouse',          'France', [1.4580, 43.5950], 18, null, ['Théâtre', 'Écriture', 'Scène'],       'open',     ['Écriture', 'Mise en scène']],
  ['Lecture à voix haute Toulouse',   'Sessions bimensuelles de lecture théâtrale en groupe.',                                'Toulouse',          'France', [1.4520, 43.5980], 16, null, ['Théâtre', 'Écriture', 'Culture'],     'open',     ['Théâtre', 'Écriture']],
  // === USER 28 — OceaneB (Nantes) ===
  ['Danse contemporaine Nantes',      'Cours hebdomadaires de danse contemporaine pour adultes.',                              'Nantes',            'France', [-1.5650, 47.2250], 18, null, ['Danse', 'Scène', 'Art'],              'open',     ['Danse', 'Chorégraphie']],
  ['Création chorégraphique Nantes',  'Création d une pièce chorégraphique collective.',                                     'Nantes',            'France', [-1.5700, 47.2200], 20, null, ['Danse', 'Scène', 'Création'],         'open',     ['Danse', 'Chorégraphie']],
  // === USER 29 — FlorianD (Bordeaux) ===
  ['Battle hip-hop Bordeaux',         'Préparation d une battle de danse hip-hop ouverte à tous.',                            'Bordeaux',          'France', [-0.5900, 44.8280], 15, null, ['Danse', 'Hip-hop', 'Compétition'],    'open',     ['Danse', 'Scène']],
  ['Atelier krump et waacking',       'Ateliers de styles urbains pour niveaux intermédiaires.',                              'Bordeaux',          'France', [-0.5850, 44.8310], 16, null, ['Danse', 'Hip-hop', 'Scène'],          'open',     ['Danse', 'Scène']],
  // === USER 30 — LiamC (Morges) ===
  ['Maraude solidaire Morges',        'Distribution de repas et accompagnement des personnes en précarité.',                  'Morges',            'Suisse', [6.4985, 46.5111], 18, null, ['Solidarité', 'Bénévolat', 'Social'],  'open',     ['Bénévolat', 'Lien social']],
  ['Repair café Morges',              'Atelier de réparation d objets pour allonger leur vie.',                               'Morges',            'Suisse', [6.5020, 46.5090], 16, null, ['DIY', 'Réparation', 'Écologie'],      'open',     ['DIY', 'Bénévolat']],
  // === USER 31 — AdamR (Neuchâtel) ===
  ['Club échecs Neuchâtel',           'Parties rapides, analyse et tournois amicaux.',                                        'Neuchâtel',         'Suisse', [6.9293, 46.9918], 13, null, ['Échecs', 'Stratégie', 'Tournoi'],     'open',     ['Stratégie', 'Concentration']],
  ['Tournoi open échecs romand',      'Tournoi régional ouvert à tous les niveaux.',                                          'Neuchâtel',         'Suisse', [6.9350, 46.9890], 14, null, ['Échecs', 'Compétition', 'Tournoi'],   'open',     ['Stratégie', 'Organisation']],
  // === USER 32 — SophieG (Marseille) ===
  ['Collecte alimentaire Marseille',  'Organisation de collectes alimentaires pour associations locales.',                    'Marseille',         'France', [5.3850, 43.3080], 16, null, ['Solidarité', 'Bénévolat', 'Social'],  'open',     ['Bénévolat', 'Organisation']],
  ['Vestiaire solidaire Marseille',   'Collecte et redistribution de vêtements aux personnes dans le besoin.',               'Marseille',         'France', [5.3790, 43.3050], 16, null, ['Solidarité', 'Bénévolat', 'Social'],  'open',     ['Bénévolat', 'Organisation']],
  // === USER 33 — MartinT (Paris) ===
  ['Festival solidaire Paris',        'Festival musique et art au profit d associations locales.',                            'Paris',             'France', [2.3200, 48.8650], 18, null, ['Festival', 'Solidarité', 'Musique'],  'open',     ['Organisation', 'Communication']],
  ['Forum associations Paris',        'Rencontre annuelle des associations parisiennes au grand public.',                     'Paris',             'France', [2.3150, 48.8680], 18, null, ['Événementiel', 'Social', 'Communauté'],'open',    ['Organisation', 'Communication']],
  // === USER 34 — JulieR (Lille) ===
  ['Aide aux devoirs Lille',          'Bénévolat hebdomadaire pour aider des collégiens en difficulté.',                      'Lille',             'France', [3.0573, 50.6292], 17, null, ['Bénévolat', 'Éducation', 'Social'],   'open',     ['Pédagogie', 'Lien social']],
  ['Soutien scolaire adultes Lille',  'Aide à la remise à niveau pour adultes en reconversion.',                              'Lille',             'France', [3.0620, 50.6260], 18, null, ['Bénévolat', 'Éducation', 'Social'],   'open',     ['Pédagogie', 'Lien social']],
  // === USER 35 — ClaireD (Lyon) ===
  ['Cuisine du monde Lyon',           'Découverte des cuisines du monde à travers des ateliers mensuels.',                    'Lyon',              'France', [4.8200, 45.7800], 16, null, ['Cuisine', 'Culture', 'Communauté'],   'open',     ['Cuisine', 'Pédagogie']],
  ['Atelier boulangerie Lyon',        'Apprendre à faire son pain et ses viennoiseries maison.',                              'Lyon',              'France', [4.8240, 45.7770], 16, null, ['Cuisine', 'Pâtisserie', 'Atelier'],   'open',     ['Cuisine', 'Pâtisserie']],
  // === USER 36 — YannP (Bordeaux) ===
  ['Club dégustation vins Bordeaux',  'Dégustations commentées de vins bordelais et initiation à l oenologie.',              'Bordeaux',          'France', [-0.5700, 44.8300], 18, null, ['Oenologie', 'Gastronomie', 'Cuisine'],'open',     ['Cuisine', 'Gastronomie']],
  ['Marché producteurs Bordeaux',     'Organisation d un marché mensuel producteurs locaux.',                                 'Bordeaux',          'France', [-0.5750, 44.8330], 18, null, ['Gastronomie', 'Communauté', 'Cuisine'],'open',    ['Cuisine', 'Organisation']],
  // === USER 37 — LauraM (Paris) ===
  ['Cours pâtisserie Paris',          'Ateliers hebdomadaires de pâtisserie française pour débutants.',                       'Paris',             'France', [2.3610, 48.8440], 16, null, ['Pâtisserie', 'Cuisine', 'Atelier'],   'open',     ['Cuisine', 'Pâtisserie']],
  ['Nutrition et équilibre alimentaire','Ateliers sur la nutrition et l équilibre alimentaire.',                              'Paris',             'France', [2.3650, 48.8410], 18, null, ['Nutrition', 'Cuisine', 'Santé'],      'open',     ['Cuisine', 'Nutrition']],
  // === USER 38 — EthanG (Genève) ===
  ['Brunch solidaire Genève',         'Brunch mensuel dont les bénéfices vont à une association locale.',                     'Genève',            'Suisse', [6.1408, 46.1850], 18, null, ['Cuisine', 'Solidarité', 'Communauté'],'open',     ['Cuisine', 'Organisation']],
  ['Atelier chocolaterie Genève',     'Découverte de l art du chocolat artisanal avec un maître chocolatier.',               'Genève',            'Suisse', [6.1450, 46.1880], 16, null, ['Cuisine', 'Pâtisserie', 'Atelier'],   'open',     ['Cuisine', 'Pâtisserie']],
  // === USER 39 — CamilleF (Grenoble) ===
  ['Pop-up restaurant étudiant',      'Restaurant éphémère tenu par des étudiants en école hôtelière.',                       'Grenoble',          'France', [5.7150, 45.1820], 18, null, ['Cuisine', 'Gastronomie', 'Événementiel'],'open',  ['Cuisine', 'Organisation']],
  ['Food truck collectif Grenoble',   'Création et gestion collective d un food truck éphémère.',                             'Grenoble',          'France', [5.7180, 45.1800], 20, null, ['Cuisine', 'Gastronomie', 'Social'],   'open',     ['Cuisine', 'Organisation']],
  // === USER 40 — MilaR (Nyon) ===
  ['Studio podcast Nyon',             'Podcast hebdomadaire sur la vie associative romande.',                                 'Nyon',              'Suisse', [6.2414, 46.3832], 16, null, ['Podcast', 'Médias', 'Audio'],         'open',     ['Podcast', 'Écriture']],
  ['Webzine jeunesse romande',        'Magazine en ligne tenu par et pour les jeunes de Romandie.',                           'Nyon',              'Suisse', [6.2450, 46.3810], 15, null, ['Écriture', 'Médias', 'Jeunesse'],     'open',     ['Écriture', 'Communication']],
  // === USER 41 — QuentinM (Paris) ===
  ['Podcast jeunesse et politique',   'Podcast mensuel sur la vie politique vue par les jeunes.',                             'Paris',             'France', [2.3450, 48.8780], 18, null, ['Podcast', 'Journalisme', 'Politique'],'open',     ['Journalisme', 'Podcast']],
  ['Revue de presse collaborative',   'Groupe de journalistes citoyens produisant une revue hebdomadaire.',                  'Paris',             'France', [2.3500, 48.8750], 18, null, ['Journalisme', 'Écriture', 'Médias'],  'open',     ['Journalisme', 'Écriture']],
  // === USER 42 — AmelieF (Strasbourg) ===
  ['Blog culture Alsace',             'Blog collaboratif sur la culture et les événements alsaciens.',                        'Strasbourg',        'France', [7.7650, 48.5800], 17, null, ['Blog', 'Écriture', 'Culture'],        'open',     ['Écriture', 'Médias']],
  ['Newsletter associations Alsace',  'Newsletter mensuelle sur les initiatives associatives alsaciennes.',                  'Strasbourg',        'France', [7.7600, 48.5780], 18, null, ['Écriture', 'Communication', 'Social'], 'open',    ['Écriture', 'Communication']],
  // === USER 43 — DamienL (Nantes) ===
  ['Podcast tech Nantes',             'Podcast bimensuel sur les startups et l innovation à Nantes.',                        'Nantes',            'France', [-1.5400, 47.2100], 18, null, ['Podcast', 'Tech', 'Innovation'],      'open',     ['Podcast', 'Audio']],
  ['Radio web associative Nantes',    'Web-radio gérée par des bénévoles passionnés de musique.',                            'Nantes',            'France', [-1.5450, 47.2130], 17, null, ['Médias', 'Podcast', 'Musique'],       'open',     ['Médias', 'Communication']],
  // === USER 44 — NoemiB (Lausanne) ===
  ['Blog lifestyle romand',           'Blog collectif sur le mode de vie et les sorties en Romandie.',                       'Lausanne',          'Suisse', [6.6450, 46.5270], 16, null, ['Écriture', 'Blog', 'Culture'],        'open',     ['Écriture', 'Communication']],
  ['Guide sorties Lausanne',          'Application de recommandations de sorties culturelles à Lausanne.',                   'Lausanne',          'Suisse', [6.6500, 46.5240], 18, null, ['Médias', 'Culture', 'Dev'],            'open',     ['Communication', 'Écriture']],
  // === USER 45 — GabrielP (Lausanne) ===
  ['Club électronique Lausanne',      'Ateliers d initiation à l électronique et à Arduino.',                                 'Lausanne',          'Suisse', [6.6380, 46.5240], 15, null, ['Arduino', 'Électronique', 'STEM'],    'open',     ['Arduino', 'STEM']],
  ['Fab lab ouvert Lausanne',         'Espace de fabrication partagé avec imprimantes 3D et outils.',                        'Lausanne',          'Suisse', [6.6420, 46.5210], 16, null, ['STEM', 'DIY', 'Électronique'],        'open',     ['Arduino', 'STEM']],
  // === USER 46 — ValentinM (Lyon) ===
  ['Équipe robotique compétition',    'Préparation à la compétition nationale de robotique pour lycéens.',                   'Lyon',              'France', [4.8550, 45.7480], 15, 18,   ['Robotique', 'STEM', 'Compétition'],   'open',     ['Robotique', 'Python']],
  ['Club programmation juniors Lyon', 'Initiation à la programmation pour collégiens et lycéens.',                           'Lyon',              'France', [4.8500, 45.7520], 12, 18,   ['Dev', 'STEM', 'Pédagogie'],           'open',     ['Python', 'Dev']],
  // === USER 47 — EstelleH (Grenoble) ===
  ['Atelier IA et éthique',           'Réflexion sur l IA, ses usages et ses limites éthiques.',                             'Grenoble',          'France', [5.7400, 45.1800], 18, null, ['IA', 'Éthique', 'Dev'],               'open',     ['IA', 'Data']],
  ['Dataviz données ouvertes Grenoble','Visualisation des données ouvertes de la ville de Grenoble.',                        'Grenoble',          'France', [5.7350, 45.1830], 18, null, ['Data', 'Dev', 'Communauté'],           'open',     ['Data', 'Python']],
  // === USER 48 — ClementR (Paris) ===
  ['Open source pour associations',   'Solutions open source pour des associations parisiennes.',                             'Paris',             'France', [2.3800, 48.8660], 18, null, ['Dev', 'Open source', 'Social'],       'open',     ['Dev', 'JavaScript']],
  ['Hackathon GovTech Paris',         'Hackathon pour améliorer les services publics par le numérique.',                     'Paris',             'France', [2.3750, 48.8700], 20, null, ['Hackathon', 'Dev', 'Social'],         'open',     ['Dev', 'JavaScript']],
  // === USER 49 — InesB (Strasbourg) ===
  ['Visite guidée archi Strasbourg',  'Circuit commenté dans le Neustadt autour du patrimoine archi.',                        'Strasbourg',        'France', [7.7400, 48.5670], 14, null, ['Architecture', 'Patrimoine', 'Culture'],'open',   ['Architecture', 'Dessin']],
  ['Maquettes quartiers Strasbourg',  'Création de maquettes d îlots urbains à l échelle 1/200.',                            'Strasbourg',        'France', [7.7450, 48.5700], 16, null, ['Architecture', 'Dessin', 'Atelier'],  'open',     ['Architecture', 'Dessin']],
  // === USER 50 — RomainT (Thonon) ===
  ['Club voile lac Léman',            'Navigation en dériveur sur le lac Léman, tous niveaux.',                               'Thonon-les-Bains',  'France', [6.4789, 46.3702], 14, null, ['Voile', 'Sport nautique', 'Nature'],   'open',    ['Voile', 'Organisation']],
  ['Canoë kayak Léman',               'Sessions de canoë-kayak sur le lac et les rivières alentours.',                       'Thonon-les-Bains',  'France', [6.4820, 46.3720], 14, null, ['Sport nautique', 'Nature', 'Outdoor'], 'open',    ['Sport', 'Outdoor']],
  // === USER 51 — ThomasR (Annecy) ===
  ['Randonnée Préalpes Annecy',       'Sorties nature bi-mensuelles dans les préalpes franco-suisses.',                       'Annecy',            'France', [6.1200, 45.8950], 16, null, ['Randonnée', 'Nature', 'Outdoor'],     'open',     ['Plein air', 'Sport']],
  ['Via ferrata débutants Annecy',    'Découverte des via ferrata dans les massifs autour d Annecy.',                        'Annecy',            'France', [6.1300, 45.9050], 16, null, ['Escalade', 'Outdoor', 'Sport'],        'open',     ['Escalade', 'Outdoor']],
  // === USER 52 — MarionP (Grenoble) ===
  ['Initiation ski de rando',         'Sorties ski de randonnée pour débutants encadrées par un guide.',                     'Grenoble',          'France', [5.7200, 45.1840], 18, null, ['Ski', 'Randonnée', 'Montagne'],       'open',     ['Ski', 'Outdoor']],
  ['Cours snowboard Chamrousse',      'Cours collectifs de snowboard pour débutants et intermédiaires.',                     'Grenoble',          'France', [5.7100, 45.1900], 14, null, ['Ski', 'Sport', 'Jeunesse'],            'open',     ['Ski', 'Sport']],
  // === USER 53 — ArthurG (Sion) ===
  ['Club alpinisme Valais',           'Progression en alpinisme avec sorties glaciaires et haute altitude.',                  'Sion',              'Suisse', [7.3750, 46.2180], 20, null, ['Alpinisme', 'Montagne', 'Sport'],     'open',     ['Ski', 'Alpinisme']],
  ['Raquettes plateau des Mayens',    'Sorties raquettes encadrées sur le plateau des Mayens.',                               'Sion',              'Suisse', [7.3800, 46.2220], 14, null, ['Randonnée', 'Ski', 'Nature'],         'open',     ['Ski', 'Outdoor']],
  // === USER 54 — JulietteB (Berne) ===
  ['Vélo tour lac de Neuchâtel',      'Tour cycliste du lac de Neuchâtel sur 2 jours.',                                      'Berne',             'Suisse', [7.4600, 46.9380], 16, null, ['Cyclisme', 'Sport', 'Nature'],        'open',     ['Cyclisme', 'Outdoor']],
  ['Bikepacking Alpes',               'Traversée itinérante des Alpes à vélo en mode bikepacking.',                          'Berne',             'Suisse', [7.4650, 46.9350], 20, null, ['Cyclisme', 'Outdoor', 'Aventure'],    'open',     ['Cyclisme', 'Sport']],
  // === USER 55 — NicolasG (Paris) ===
  ['Tournoi e-sport Paris',           'Tournoi de jeux vidéo compétitifs inter-établissements.',                              'Paris',             'France', [2.3300, 48.8400], 14, 22,   ['E-sport', 'Jeux', 'Compétition'],     'open',     ['E-sport', 'Organisation']],
  ['LAN party mensuelle Paris',       'Soirées LAN avec tournois de jeux en réseau.',                                        'Paris',             'France', [2.3350, 48.8380], 16, null, ['E-sport', 'Jeux', 'Communauté'],      'open',     ['E-sport', 'Organisation']],
  // === USER 56 — MathieuS (Lyon) ===
  ['Club jeux de société Lyon',       'Sessions hebdomadaires de jeux modernes : eurogames, coopératifs.',                    'Lyon',              'France', [4.8100, 45.7650], 14, null, ['Jeux', 'Stratégie', 'Communauté'],    'open',     ['Stratégie', 'Organisation']],
  ['Café jeux mensuel Lyon',          'Café jeux ouvert au public un samedi par mois.',                                      'Lyon',              'France', [4.8150, 45.7680], 12, null, ['Jeux', 'Communauté', 'Social'],       'open',     ['Jeux', 'Organisation']],
  // === USER 57 — MarieT (Lausanne) ===
  ['Club jeux de rôle Lausanne',      'Campagnes de jeux de rôle, tous univers bienvenus.',                                  'Lausanne',          'Suisse', [6.6200, 46.5130], 14, null, ['Jeux de rôle', 'Jeux', 'Communauté'], 'open',    ['Jeux de rôle', 'Écriture']],
  ['Création jeu de plateau Lausanne','Concevoir et tester un jeu de plateau collaboratif original.',                        'Lausanne',          'Suisse', [6.6250, 46.5160], 16, null, ['Jeux', 'Design', 'Création'],         'open',     ['Jeux', 'Stratégie']],
  // === USER 58 — PaulM (Bordeaux) ===
  ['Streaming gaming collectif',      'Création d une chaîne de streaming gaming collaborative.',                             'Bordeaux',          'France', [-0.5850, 44.8500], 16, null, ['E-sport', 'Streaming', 'Jeux'],       'open',     ['E-sport', 'Médias']],
  ['Podcast gaming et culture geek',  'Podcast mensuel sur les jeux vidéo et la culture geek.',                              'Bordeaux',          'France', [-0.5900, 44.8460], 16, null, ['Jeux', 'Médias', 'Podcast'],          'open',     ['Jeux', 'Podcast']],
  // === USER 59 — AlexisB (Montpellier) ===
  ['Tournoi open échecs Montpellier', 'Tournoi ouvert régional d échecs avec classement ELO officiel.',                      'Montpellier',       'France', [3.8900, 43.6200], 14, null, ['Échecs', 'Tournoi', 'Compétition'],   'open',     ['Stratégie', 'Organisation']],
  ['Initiation échecs scolaires',     'Initiation aux échecs dans les écoles primaires de Montpellier.',                     'Montpellier',       'France', [3.8850, 43.6170], 6,  12,   ['Échecs', 'Éducation', 'Pédagogie'],   'open',     ['Stratégie', 'Pédagogie']],
  // === USER 60 — CelineA (Nice) ===
  ['Cours yoga collectif Nice',       'Séances de yoga collectif en salle et en plein air.',                                  'Nice',              'France', [7.2750, 43.7000], 16, null, ['Yoga', 'Bien-être', 'Sport'],         'open',     ['Yoga', 'Coaching']],
  ['Retraite méditation weekend',     'Weekend de méditation et pleine conscience en pleine nature.',                         'Nice',              'France', [7.2700, 43.7050], 18, null, ['Méditation', 'Bien-être', 'Nature'],   'open',    ['Yoga', 'Méditation']],
  // === USER 61 — LaureM (Lausanne) ===
  ['Cours pilates collectifs Lausanne','Séances de pilates en petit groupe, tous niveaux.',                                  'Lausanne',          'Suisse', [6.6550, 46.5100], 18, null, ['Pilates', 'Bien-être', 'Sport'],       'open',     ['Yoga', 'Coaching']],
  ['Yoga prénatal et postnatal',      'Cours spécialisés pour les futures et nouvelles mamans.',                             'Lausanne',          'Suisse', [6.6590, 46.5080], 18, null, ['Yoga', 'Santé', 'Bien-être'],          'open',     ['Yoga', 'Coaching']],
  // === USER 62 — SebF (Paris) ===
  ['Bootcamp fitness Paris',          'Sessions de fitness intense en extérieur, 3 fois par semaine.',                        'Paris',             'France', [2.3650, 48.8350], 18, null, ['Fitness', 'Sport', 'Coaching'],       'open',     ['Fitness', 'Sport']],
  ['HIIT et renforcement musculaire', 'Cours de HIIT et musculation fonctionnelle en groupe.',                               'Paris',             'France', [2.3700, 48.8320], 18, null, ['Fitness', 'Sport', 'Coaching'],       'open',     ['Fitness', 'Sport']],
  // === USER 63 — AnneL (Grenoble) ===
  ['Club triathlon Grenoble',         'Entraînements natation-vélo-running pour un premier triathlon.',                       'Grenoble',          'France', [5.7100, 45.1950], 20, null, ['Natation', 'Cyclisme', 'Running'],    'open',     ['Natation', 'Sport']],
  ['Natation synchronisée Grenoble',  'Cours de natation synchronisée pour adultes débutants.',                              'Grenoble',          'France', [5.7050, 45.1980], 16, null, ['Natation', 'Sport', 'Scène'],         'open',     ['Natation', 'Sport']],
  // === USER 64 — XavierM (Nantes) ===
  ['Running group matinal Nantes',    'Sorties running matinales 3 fois par semaine, tous niveaux.',                          'Nantes',            'France', [-1.5700, 47.2050], 16, null, ['Running', 'Sport', 'Outdoor'],        'open',     ['Sport', 'Coaching']],
  ['Prépa semi-marathon Nantes',      'Programme de 12 semaines pour préparer son premier semi-marathon.',                   'Nantes',            'France', [-1.5750, 47.2020], 18, null, ['Running', 'Sport', 'Coaching'],       'open',     ['Sport', 'Plein air']],
  // === USER 65 — GuillaumeP (Paris) ===
  ['Concours urbanisme Paris',        'Compétition pour repenser un îlot parisien, ouverte aux étudiants.',                  'Paris',             'France', [2.3550, 48.8770], 18, null, ['Urbanisme', 'Architecture', 'Compétition'],'open',['Architecture', 'Urbanisme']],
  ['Balade archi Paris XIe',          'Visite guidée de l architecture du XIe arrondissement.',                               'Paris',             'France', [2.3780, 48.8620], 14, null, ['Architecture', 'Patrimoine', 'Culture'],'open',  ['Architecture', 'Dessin']],
  // === USER 66 — OliviaB (Strasbourg) ===
  ['Atelier maquette architecture',   'Construction de maquettes architecturales à l échelle.',                               'Strasbourg',        'France', [7.7700, 48.5650], 16, null, ['Architecture', 'Dessin', 'Atelier'],  'open',     ['Architecture', 'Dessin']],
  ['Concours design intérieur',       'Compétition de design intérieur pour étudiants de la région.',                        'Strasbourg',        'France', [7.7650, 48.5680], 18, null, ['Design', 'Architecture', 'Création'],  'open',     ['Design', 'Architecture']],
  // === USER 67 — EricL (Lyon) ===
  ['Balades urbaines Lyon',           'Visites guidées thématiques sur l urbanisme lyonnais.',                                'Lyon',              'France', [4.8450, 45.7700], 14, null, ['Urbanisme', 'Patrimoine', 'Culture'],  'open',    ['Urbanisme', 'Architecture']],
  ['Réhabilitation friche industrielle','Projet de reconversion d une friche industrielle lyonnaise.',                       'Lyon',              'France', [4.8520, 45.7610], 20, null, ['Urbanisme', 'Architecture', 'Social'],  'open',   ['Architecture', 'Urbanisme']],
  // === USER 68 — CharlotteD (Marseille) ===
  ['Patrimoine industriel Marseille', 'Exploration et documentation du patrimoine industriel.',                               'Marseille',         'France', [5.3550, 43.2850], 16, null, ['Patrimoine', 'Architecture', 'Culture'],'open',  ['Architecture', 'Dessin']],
  ['Musée de quartier Marseille',     'Création d un musée de proximité sur l histoire des quartiers.',                      'Marseille',         'France', [5.3600, 43.2880], 18, null, ['Culture', 'Patrimoine', 'Social'],     'open',     ['Architecture', 'Culture']],
  // === USER 69 — FrancoisB (Lyon) ===
  ['Cuisine gastronomique Lyon',      'Ateliers de cuisine gastronomique animés par un chef local.',                          'Lyon',              'France', [4.8320, 45.7500], 18, null, ['Cuisine', 'Gastronomie', 'Atelier'],  'open',     ['Cuisine', 'Gastronomie']],
  ['Dîner caritatif mensuel Lyon',    'Dîner mensuel dont les bénéfices soutiennent des associations.',                      'Lyon',              'France', [4.8360, 45.7530], 18, null, ['Cuisine', 'Solidarité', 'Gastronomie'],'open',    ['Cuisine', 'Organisation']],
  // === USER 70 — AnaisD (Montpellier) ===
  ['Pâtisserie méditerranéenne',      'Découverte des pâtisseries méditerranéennes en ateliers.',                             'Montpellier',       'France', [3.8650, 43.6030], 16, null, ['Pâtisserie', 'Cuisine', 'Culture'],   'open',     ['Pâtisserie', 'Cuisine']],
  ['Ateliers viennoiseries weekend',  'Cours de viennoiserie le samedi matin pour amateurs.',                                'Montpellier',       'France', [3.8700, 43.6060], 16, null, ['Pâtisserie', 'Cuisine', 'Atelier'],   'open',     ['Pâtisserie', 'Cuisine']],
  // === USER 71 — OlivierH (Bordeaux) ===
  ['Initiation œnologie Bordeaux',    'Découverte des vins de Bordeaux avec dégustations commentées.',                       'Bordeaux',          'France', [-0.5600, 44.8200], 18, null, ['Oenologie', 'Gastronomie', 'Cuisine'],'open',     ['Oenologie', 'Gastronomie']],
  ['Cave coopérative amateurs',       'Club de passionnés partageant leur production de vin maison.',                        'Bordeaux',          'France', [-0.5650, 44.8230], 18, null, ['Oenologie', 'DIY', 'Communauté'],     'open',     ['Oenologie', 'Gastronomie']],
  // === USER 72 — CharlineR (Genève) ===
  ['Festival interculturel Genève',   'Festival célébrant la diversité culturelle de Genève.',                               'Genève',            'Suisse', [6.1650, 46.2020], 16, null, ['Festival', 'Culture', 'Communauté'],  'open',     ['Organisation', 'Communication']],
  ['Marché artisanal saisonnier',     'Marché artisanal mensuel mettant en valeur les créateurs locaux.',                   'Genève',            'Suisse', [6.1600, 46.1990], 18, null, ['Artisanat', 'Culture', 'Événementiel'],'open',    ['Organisation', 'Communication']],
  // === USER 73 — RemiL (Paris) ===
  ['Repair café Paris',               'Atelier de réparation d objets du quotidien pour allonger leur vie.',                 'Paris',             'France', [2.3100, 48.8590], 16, null, ['DIY', 'Réparation', 'Écologie'],      'open',     ['DIY', 'Bénévolat']],
  ['Troc et partage Paris',           'Bourse d échange d objets et de services entre voisins.',                             'Paris',             'France', [2.3080, 48.8610], 16, null, ['Communauté', 'Solidarité', 'DIY'],    'open',     ['Bénévolat', 'Communauté']],
  // === USER 74 — LucieG (Nantes) ===
  ['Radio associative Nantes',        'Web-radio associative portée par des bénévoles nantais.',                              'Nantes',            'France', [-1.5300, 47.2300], 17, null, ['Médias', 'Podcast', 'Communauté'],    'open',     ['Médias', 'Communication']],
  ['Journal de quartier Nantes',      'Journal papier et numérique dédié aux actualités du quartier.',                       'Nantes',            'France', [-1.5350, 47.2270], 17, null, ['Médias', 'Écriture', 'Communauté'],   'open',     ['Écriture', 'Communication']],
  // === USER 75 — JeanB (Rennes) ===
  ['Visite personnes âgées Rennes',   'Visites hebdomadaires de personnes âgées isolées en EHPAD.',                          'Rennes',            'France', [-1.6650, 48.1080], 18, null, ['Bénévolat', 'Social', 'Lien social'], 'open',     ['Bénévolat', 'Lien social']],
  ['Café intergénérationnel Rennes',  'Rencontres régulières entre jeunes et seniors autour d activités.',                  'Rennes',            'France', [-1.6700, 48.1120], 16, null, ['Bénévolat', 'Social', 'Communauté'],  'open',     ['Bénévolat', 'Lien social']],
  // === USER 76 — NoemieP (Montpellier) ===
  ['Collectif photo nature',          'Sorties photo en nature avec expositions collectives.',                                 'Montpellier',       'France', [3.8850, 43.6030], 16, null, ['Photo', 'Nature', 'Art'],             'open',     ['Photo', 'Dessin']],
  ['Studio photo collaboratif',       'Studio partagé pour photographes amateurs et semi-pros.',                             'Montpellier',       'France', [3.8800, 43.6060], 18, null, ['Photo', 'Art', 'Créativité'],         'open',     ['Photo', 'Montage']],
  // === USER 77 — BenoitC (Rennes) ===
  ['Club foot loisir Rennes',         'Matchs de football loisir le weekend, ambiance conviviale.',                           'Rennes',            'France', [-1.6900, 48.1250], 16, null, ['Football', 'Sport', 'Loisir'],        'open',     ['Football', 'Sport']],
  ['Tournoi foot en salle Rennes',    'Tournoi de football en salle mensuel ouvert à toutes les équipes.',                   'Rennes',            'France', [-1.6850, 48.1200], 16, null, ['Football', 'Sport', 'Tournoi'],       'open',     ['Football', 'Organisation']],
  // === USER 78 — AmelieG (Nice) ===
  ['Illustration numérique Nice',     'Initiation à l illustration numérique sur tablette.',                                  'Nice',              'France', [7.2500, 43.7200], 16, null, ['Illustration', 'Art', 'Numérique'],   'open',     ['Illustration', 'Design']],
  ['Atelier BD et manga',             'Créer sa propre bande dessinée ou manga en groupe.',                                  'Nice',              'France', [7.2550, 43.7180], 14, null, ['Illustration', 'Dessin', 'Art'],      'open',     ['Illustration', 'Dessin']],
  // === USER 79 — ThomasG (Zurich) ===
  ['Meetup dev Zurich',               'Rencontres mensuelles de développeurs pour partager des projets.',                     'Zurich',            'Suisse', [8.5417, 47.3769], 18, null, ['Dev', 'Web', 'Communauté'],           'open',     ['JavaScript', 'Dev']],
  ['Hackathon startups Zurich',       'Hackathon 48h pour développer des prototypes de startups.',                           'Zurich',            'Suisse', [8.5460, 47.3740], 18, null, ['Hackathon', 'Dev', 'Startup'],        'open',     ['Dev', 'JavaScript']],
  // === USER 80 — LeaD (Paris) ===
  ['Atelier UX design Paris',         'Ateliers pratiques de UX research et prototypage d interfaces.',                      'Paris',             'France', [2.3420, 48.8700], 18, null, ['Design', 'UI', 'UX'],                 'open',     ['Design', 'Figma']],
  ['Sprint design sprint Paris',      'Séances de design sprint pour résoudre des problèmes en 5 jours.',                   'Paris',             'France', [2.3460, 48.8730], 20, null, ['Design', 'Méthodologie', 'UX'],        'open',     ['Design', 'Figma']],
  // === USER 81 — HugoM (Lyon) ===
  ['Atelier Python ML Lyon',          'Atelier mensuel sur le machine learning appliqué avec Python.',                       'Lyon',              'France', [4.8380, 45.7590], 18, null, ['IA', 'Python', 'Data'],               'open',     ['Python', 'IA']],
  ['Groupe lecture data science',     'Lecture et discussion d articles de recherche en data science.',                      'Lyon',              'France', [4.8420, 45.7620], 20, null, ['Data', 'Recherche', 'IA'],             'open',     ['Data', 'Python']],
  // === USER 82 — EmmaK (Strasbourg) ===
  ['Chorale pop rock Strasbourg',     'Chorale moderne ouverte à tous avec répertoire pop et rock.',                         'Strasbourg',        'France', [7.7550, 48.5740], 17, null, ['Musique', 'Chant', 'Scène'],          'open',     ['Musique', 'Chant']],
  ['Enregistrement album studio',     'Enregistrement collectif d un album de reprises en studio amateur.',                  'Strasbourg',        'France', [7.7590, 48.5770], 18, null, ['Musique', 'Studio', 'Composition'],   'open',     ['Musique', 'Composition']],
  // === USER 83 — LucasB (Bordeaux) ===
  ['Groupe trail côte atlantique',    'Sorties trail mensuelles sur la côte atlantique girondine.',                          'Bordeaux',          'France', [-0.5500, 44.8400], 18, null, ['Trail', 'Running', 'Nature'],         'open',     ['Sport', 'Outdoor']],
  ['Prépa marathon Bordeaux',         'Programme de préparation au Marathon du Médoc.',                                      'Bordeaux',          'France', [-0.5550, 44.8350], 20, null, ['Running', 'Sport', 'Coaching'],       'open',     ['Sport', 'Plein air']],
  // === USER 84 — SofiaR (Genève) ===
  ['Compagnie danse Genève',          'Compagnie de danse contemporaine ouverte à toutes les esthétiques.',                  'Genève',            'Suisse', [6.1480, 46.2050], 18, null, ['Danse', 'Scène', 'Art'],              'open',     ['Danse', 'Chorégraphie']],
  ['Stage intensif danse Genève',     'Stage de 5 jours sur différentes techniques de danse.',                               'Genève',            'Suisse', [6.1520, 46.2070], 16, null, ['Danse', 'Scène', 'Formation'],        'open',     ['Danse', 'Scène']],
  // === USER 85 — EthanD (Toulouse) ===
  ['Ciné-club amateurs Toulouse',     'Projection et débat de films indépendants, une fois par mois.',                      'Toulouse',          'France', [1.4350, 43.6000], 16, null, ['Vidéo', 'Culture', 'Cinéma'],         'open',     ['Vidéo', 'Montage']],
  ['Court-métrage collectif',         'Réalisation d un court-métrage de 10 minutes par une équipe amateur.',               'Toulouse',          'France', [1.4400, 43.5970], 18, null, ['Vidéo', 'Cinéma', 'Création'],        'open',     ['Vidéo', 'Montage']],
  // === USER 86 — ChloeS (Nantes) ===
  ['Banque du temps Nantes',          'Échange de services entre habitants sans argent.',                                    'Nantes',            'France', [-1.5450, 47.2180], 16, null, ['Social', 'Communauté', 'Bénévolat'],  'open',     ['Bénévolat', 'Communication']],
  ['Épicerie solidaire Nantes',       'Épicerie à prix réduits pour les personnes en difficultés.',                         'Nantes',            'France', [-1.5500, 47.2150], 18, null, ['Solidarité', 'Social', 'Bénévolat'],  'open',     ['Bénévolat', 'Organisation']],
  // === USER 87 — MaximeP (Marseille) ===
  ['Atelier pizza napolitaine',       'Apprendre la vraie pizza napolitaine avec un pizzaïolo certifié.',                   'Marseille',         'France', [5.3700, 43.2920], 16, null, ['Cuisine', 'Gastronomie', 'Atelier'],  'open',     ['Cuisine', 'Gastronomie']],
  ['Pop-up bar à desserts',           'Bar à desserts éphémère organisé par des passionnés de pâtisserie.',                 'Marseille',         'France', [5.3740, 43.2950], 18, null, ['Cuisine', 'Pâtisserie', 'Événementiel'],'open',   ['Cuisine', 'Pâtisserie']],
  // === USER 88 — AliceW (Bâle) ===
  ['Atelier soudure électronique',    'Initiation à la soudure et création de circuits électroniques.',                      'Bâle',              'Suisse', [7.5840, 47.5580], 15, null, ['Électronique', 'STEM', 'DIY'],        'open',     ['Arduino', 'Électronique']],
  ['Projet IoT maison connectée',     'Construire ensemble une installation domotique avec Arduino.',                        'Bâle',              'Suisse', [7.5870, 47.5560], 18, null, ['Arduino', 'IoT', 'STEM'],             'open',     ['Arduino', 'Électronique']],
  // === USER 89 — MathieuL (Grenoble) ===
  ['Club alpinisme Vercors',          'Sorties alpinisme et randonnée dans le massif du Vercors.',                          'Grenoble',          'France', [5.7050, 45.2050], 20, null, ['Alpinisme', 'Randonnée', 'Outdoor'],  'open',     ['Escalade', 'Outdoor']],
  ['Escalade compétition indoor',     'Préparation aux compétitions d escalade de vitesse et de bloc.',                     'Grenoble',          'France', [5.7100, 45.2020], 16, null, ['Escalade', 'Sport', 'Compétition'],   'open',     ['Escalade', 'Sport']],
  // === USER 90 — JulieM (Lausanne) ===
  ['Club yoga kundalini Lausanne',    'Pratique hebdomadaire du yoga kundalini en petit groupe.',                            'Lausanne',          'Suisse', [6.6600, 46.5060], 18, null, ['Yoga', 'Méditation', 'Bien-être'],    'open',     ['Yoga', 'Méditation']],
  ['Randonnée bien-être Jura',        'Sorties randonnée combinant marche et séances de méditation.',                       'Lausanne',          'Suisse', [6.6650, 46.5030], 18, null, ['Randonnée', 'Méditation', 'Nature'],  'open',     ['Yoga', 'Plein air']],
  // === USER 91 — PierreF (Berne) ===
  ['Podcast culture romand',          'Podcast bimensuel sur la vie culturelle de Romandie.',                                'Berne',             'Suisse', [7.4500, 46.9430], 17, null, ['Podcast', 'Culture', 'Médias'],       'open',     ['Podcast', 'Communication']],
  ['Newsletter startup Suisse',       'Newsletter hebdomadaire sur les startups helvétiques.',                               'Berne',             'Suisse', [7.4540, 46.9450], 20, null, ['Médias', 'Startup', 'Communication'], 'open',     ['Communication', 'Écriture']],
  // === USER 92 — SarahR (Montpellier) ===
  ['Atelier aquarelle Montpellier',   'Cours d aquarelle pour débutants et confirmés.',                                     'Montpellier',       'France', [3.8780, 43.6080], 14, null, ['Peinture', 'Art', 'Atelier'],         'open',     ['Dessin', 'Peinture']],
  ['Carnet de voyage illustré',       'Créer et partager des carnets de voyage dessinés.',                                  'Montpellier',       'France', [3.8750, 43.6050], 16, null, ['Illustration', 'Voyage', 'Art'],      'open',     ['Illustration', 'Dessin']],
  // === USER 93 — AntoineB (Rennes) ===
  ['API open data Rennes',            'Développer des applications utilisant les données ouvertes de Rennes.',               'Rennes',            'France', [-1.6720, 48.1140], 18, null, ['Dev', 'Open source', 'Data'],         'open',     ['Dev', 'Node.js']],
  ['Appli mobilité douce Rennes',     'App mobile pour planifier ses déplacements à vélo et à pied.',                       'Rennes',            'France', [-1.6760, 48.1110], 18, null, ['Dev', 'Mobilité', 'Web'],             'open',     ['Dev', 'React']],
  // === USER 94 — MarineP (Nice) ===
  ['Triathlon côte d Azur',           'Entraînement pour le triathlon olympique de Nice.',                                  'Nice',              'France', [7.2650, 43.7060], 18, null, ['Natation', 'Cyclisme', 'Running'],    'open',     ['Sport', 'Coaching']],
  ['Aquabike en plein air Nice',      'Séances d aquabike dans la mer par beau temps.',                                     'Nice',              'France', [7.2700, 43.7030], 18, null, ['Natation', 'Sport', 'Fitness'],       'open',     ['Sport', 'Coaching']],
  // === USER 95 — ClementH (Paris) ===
  ['Théâtre forum social Paris',      'Théâtre forum sur des problématiques sociales contemporaines.',                       'Paris',             'France', [2.3600, 48.8590], 18, null, ['Théâtre', 'Social', 'Scène'],         'open',     ['Théâtre', 'Scène']],
  ['Atelier stand-up comédie Paris',  'Apprendre les techniques du stand-up et se produire en scène.',                     'Paris',             'France', [2.3640, 48.8610], 20, null, ['Théâtre', 'Humour', 'Scène'],         'open',     ['Théâtre', 'Improvisation']],
  // === USER 96 — ZoeM (Genève) ===
  ['Ruches urbaines Genève',          'Apiculture urbaine : installation et entretien de ruches en ville.',                 'Genève',            'Suisse', [6.1560, 46.1960], 18, null, ['Écologie', 'Nature', 'Communauté'],   'open',     ['Écologie', 'Jardin']],
  ['Jardins partagés Genève',         'Réseau de jardins partagés dans les quartiers genevois.',                            'Genève',            'Suisse', [6.1600, 46.1940], 16, null, ['Jardin', 'Écologie', 'Communauté'],   'open',     ['Jardin', 'Écologie']],
  // === USER 97 — RomainG (Bordeaux) ===
  ['Five de foot Bordeaux',           'Matchs de foot à 5 en salle deux fois par semaine.',                                 'Bordeaux',          'France', [-0.5800, 44.8430], 18, null, ['Football', 'Sport', 'Loisir'],        'open',     ['Football', 'Sport']],
  ['Coaching tactique foot Bordeaux', 'Sessions d analyse vidéo et de tactique pour équipes amateurs.',                    'Bordeaux',          'France', [-0.5750, 44.8460], 18, null, ['Football', 'Sport', 'Coaching'],      'open',     ['Football', 'Coaching']],
  // === USER 98 — EmmaT (Lyon) ===
  ['Campagne JDR steampunk',          'Campagne de jeu de rôle dans un univers steampunk original.',                        'Lyon',              'France', [4.8060, 45.7720], 16, null, ['Jeux de rôle', 'Écriture', 'Communauté'],'open',  ['Jeux de rôle', 'Écriture']],
  ['Atelier création de monde JDR',   'Construire collaborativement un univers de jeu de rôle inédit.',                    'Lyon',              'France', [4.8090, 45.7750], 17, null, ['Jeux de rôle', 'Écriture', 'Création'], 'open',  ['Jeux de rôle', 'Écriture']],
  // === USER 99 — LeoB (Zurich) ===
  ['Groupe recherche IA Zurich',      'Veille et discussions sur les dernières avancées en intelligence artificielle.',     'Zurich',            'Suisse', [8.5370, 47.3800], 20, null, ['IA', 'Data', 'Recherche'],             'open',     ['IA', 'Python']],
  ['Hackathon data humanitaire',      'Hackathon utilisant la data au service de causes humanitaires.',                     'Zurich',            'Suisse', [8.5420, 47.3780], 20, null, ['Hackathon', 'Data', 'Social'],         'open',     ['Data', 'Python']],
];

function buildProject(ownerId, seed, startDate, endDate, status) {
  const [title, description, city, country, coordinates, minAge, maxAge, tags, , skills] = seed;
  return {
    ownerId,
    title,
    description,
    tags,
    requiredSkills: skills,
    minAge,
    maxAge,
    maxParticipants: 20,
    participants: [],
    status,
    visibility: 'public',
    location: { type: 'Point', coordinates },
    projectMeta: {
      startDate,
      endDate: endDate || null,
      repoUrl: '',
      budget: 0,
      region: country,
      city,
    },
    langues: ['Français'],
  };
}

function makeProject(ownerId, seed, index) {
  const status = seed[8];
  const now = new Date();
  const startDate = new Date(now);

  if (['closed', 'archived'].includes(status)) {
    startDate.setDate(startDate.getDate() - (60 + index * 3));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30 + (index % 4) * 7);
    return buildProject(ownerId, seed, startDate, endDate, status);
  } else {
    startDate.setDate(startDate.getDate() + (index % 7));
    const endDate = index % 3 !== 0 ? new Date(startDate.getTime() + 1000 * 60 * 60 * 24 * (21 + index)) : null;
    return buildProject(ownerId, seed, startDate, endDate, status);
  }
}

async function run() {
  await connectDB(process.env.MONGO_URI);

  console.log('Suppression des collections...');
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    ProjectHistory.deleteMany({}),
    ProjectRequest.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    Notification.deleteMany({}),
    ProjectCover.deleteMany({}),
  ]);
  console.log('Collections vidées.');

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const createdUsers = [];
  for (const [email, firstName, lastName, displayName, city, country, score, votes, skills, languages] of userSeeds) {
    const user = await User.create({
      email, firstName, lastName, displayName,
      passwordHash,
      emailVerified: true,
      bio: `Profil démo de ${displayName}.`,
      age: 20 + (createdUsers.length % 15),
      address: { city, country },
      languages, skills,
      avatarUrl: '',
      reputation: { score, votes },
      role: 'user',
      profileCompleted: true,
    });
    createdUsers.push(user);
  }
  console.log(`${createdUsers.length} utilisateurs créés.`);

  // Each user gets exactly 2 projects: projectSeeds[i*2] and projectSeeds[i*2+1]
  for (let i = 0; i < projectSeeds.length; i++) {
    const ownerIndex = Math.floor(i / 2);
    const owner = createdUsers[ownerIndex];
    await Project.create(makeProject(owner._id, projectSeeds[i], i));
  }
  console.log(`${projectSeeds.length} projets créés.`);

  // Images de couverture générées, attribuées par famille de thèmes.
  await attachDemoCovers();

  console.log(`Mot de passe commun : ${PASSWORD}`);
}

run()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDB().catch(() => {});
    await mongoose.disconnect().catch(() => {});
  });
