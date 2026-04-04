-- Seed des themes par defaut pour MEMORIA
INSERT INTO themes (name, description, icon) VALUES
    ('Enfance', 'Souvenirs d''enfance, ecole, jeux', 'child'),
    ('Adolescence', 'Annees d''adolescence et de jeunesse', 'school'),
    ('Famille', 'Parents, fratrie, mariage, enfants, petits-enfants', 'family'),
    ('Travail', 'Metiers, carrieres, collegues, anecdotes professionnelles', 'briefcase'),
    ('Voyages', 'Destinations, vacances, decouvertes', 'plane'),
    ('Passions', 'Hobbies, musique, sport, lecture, jardinage', 'heart'),
    ('Cuisine', 'Recettes de famille, plats preferes, traditions culinaires', 'utensils'),
    ('Fetes', 'Fetes de famille, Noel, anniversaires, traditions', 'gift'),
    ('Histoire', 'Evenements historiques vecus, contexte social', 'landmark'),
    ('Vie quotidienne', 'Habitudes, routines, maison, quartier', 'home')
ON CONFLICT (name) DO NOTHING;
