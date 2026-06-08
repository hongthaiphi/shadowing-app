-- ============================================================
-- Seed: 10 Reading Lessons (r11–r20) + 10 Writing Lessons (w21–w30)
-- Run in Supabase SQL Editor or via supabase db push
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- READING LESSONS
-- ─────────────────────────────────────────────────────────────

INSERT INTO public.reading_lessons
  (id, title, level, topic, image_url, word_count, duration_minutes, paragraphs, questions)
VALUES

-- r11 ─ Starter / food
(
  'r11',
  'The School Canteen',
  'Starter',
  'food',
  'https://picsum.photos/seed/reading-canteen/800/400',
  130,
  10,
  '[
    "The school canteen at Maple Primary School is a busy place at lunchtime. It opens at twelve o''clock and closes at one o''clock. Every day, about two hundred pupils come to eat lunch there.",
    "The canteen serves hot meals every day. On Mondays, there is pasta with tomato sauce. On Wednesdays, the cooks prepare chicken and rice. Fish and chips is served every Friday, and it is the most popular meal of the week. There is also a salad bar where students can choose their own vegetables.",
    "The canteen has large windows and bright yellow walls. There are twenty round tables, and each table seats eight pupils. At the end of lunchtime, students put their trays on a trolley near the exit. The canteen staff work very hard to keep everything clean and tidy. Many pupils say the school canteen feels like a warm and friendly place."
  ]'::jsonb,
  '[
    {"id":"r11q1","type":"multiple-choice","question":"How long is the canteen open each day?","options":["Thirty minutes","One hour","Two hours","All day"],"answer":"B","explanation":"The canteen opens at twelve and closes at one — that is one hour."},
    {"id":"r11q2","type":"true-false-not-given","question":"Fish and chips is the most popular meal of the week.","answer":"True","explanation":"The passage says ''Fish and chips is served every Friday, and it is the most popular meal of the week''."},
    {"id":"r11q3","type":"true-false-not-given","question":"The canteen tables are square.","answer":"False","explanation":"The passage says there are twenty ''round'' tables, not square."},
    {"id":"r11q4","type":"true-false-not-given","question":"Some pupils bring packed lunches to the canteen.","answer":"Not Given","explanation":"The passage does not mention packed lunches at all."},
    {"id":"r11q5","type":"fill-blank","question":"The canteen has large windows and bright ________ walls.","answer":"yellow","explanation":"The passage describes ''bright yellow walls''."},
    {"id":"r11q6","type":"short-answer","question":"What do students do with their trays at the end of lunchtime?","answer":"They put their trays on a trolley near the exit."}
  ]'::jsonb
),

-- r12 ─ Starter / school
(
  'r12',
  'My Favourite Teacher',
  'Starter',
  'school',
  'https://picsum.photos/seed/reading-teacher/800/400',
  128,
  10,
  '[
    "My favourite teacher is Mr Roberts. He teaches English at my school. He is tall and has short grey hair and a friendly smile. He always wears a blue jumper to class.",
    "Mr Roberts makes every lesson interesting. He reads stories aloud in different voices, and he never shouts. When a pupil does not understand something, he explains it again in a different way until everyone understands. He also gives us creative writing tasks that let us use our imagination.",
    "Last month, Mr Roberts organised a class play. We performed it in front of our parents in the school hall. I played the role of a ship captain, and I was very nervous, but Mr Roberts told me I could do it. After the play, he said he was proud of all of us. I want to be a teacher like Mr Roberts one day."
  ]'::jsonb,
  '[
    {"id":"r12q1","type":"multiple-choice","question":"What subject does Mr Roberts teach?","options":["Maths","Science","English","History"],"answer":"C","explanation":"The passage says ''He teaches English at my school''."},
    {"id":"r12q2","type":"true-false-not-given","question":"Mr Roberts has short grey hair.","answer":"True","explanation":"The passage describes him as having ''short grey hair''."},
    {"id":"r12q3","type":"true-false-not-given","question":"Mr Roberts shouts when pupils are noisy.","answer":"False","explanation":"The passage says ''he never shouts''."},
    {"id":"r12q4","type":"true-false-not-given","question":"The class play was performed outside.","answer":"False","explanation":"The passage says the play was performed ''in the school hall'', not outside."},
    {"id":"r12q5","type":"fill-blank","question":"In the class play, the narrator played the role of a ship ________.","answer":"captain","explanation":"The passage says ''I played the role of a ship captain''."},
    {"id":"r12q6","type":"short-answer","question":"What does Mr Roberts do when a pupil does not understand something?","answer":"He explains it again in a different way until everyone understands."}
  ]'::jsonb
),

-- r13 ─ Level 1 / hobbies
(
  'r13',
  'The World of Stamp Collecting',
  'Level 1',
  'hobbies',
  'https://picsum.photos/seed/reading-stamps/800/400',
  188,
  12,
  '[
    "Stamp collecting, known by the technical name ''philately'', is one of the world''s oldest and most popular hobbies. It began in 1840, the year the first official postage stamp — the Penny Black — was issued in Britain. Within days of its release, people were already beginning to save used stamps as mementos. Today, it is estimated that around 60 million people worldwide collect stamps.",
    "Stamps are small but often beautifully designed. They depict a wide range of subjects, including famous people, historic events, wildlife, architecture, and art. For many collectors, each stamp is a tiny window into the history and culture of the country that produced it. A rare stamp in excellent condition can be worth thousands of pounds at auction.",
    "Starting a stamp collection requires very little equipment. Beginners need only a stamp album, a pair of tweezers to handle stamps without damaging them, and a magnifying glass to examine details. Stamps can be obtained from used envelopes, at local post offices, through stamp fairs, or via specialist dealers.",
    "Many collectors focus on a particular theme — such as birds, space exploration, or the Olympic Games — rather than trying to collect stamps from every country. This approach makes the hobby more manageable and personally meaningful. Stamp collecting encourages patience, attention to detail, and a genuine curiosity about the wider world."
  ]'::jsonb,
  '[
    {"id":"r13q1","type":"multiple-choice","question":"What was the name of the first official postage stamp?","options":["The Red Penny","The Penny Black","The Silver Stamp","The Penny Post"],"answer":"B","explanation":"The passage says the first official stamp was ''the Penny Black''."},
    {"id":"r13q2","type":"true-false-not-given","question":"Stamp collecting began in the twentieth century.","answer":"False","explanation":"The passage states stamp collecting began in 1840, which is the nineteenth century."},
    {"id":"r13q3","type":"true-false-not-given","question":"A rare stamp in good condition can sell for a very high price.","answer":"True","explanation":"The passage says ''A rare stamp in excellent condition can be worth thousands of pounds at auction''."},
    {"id":"r13q4","type":"true-false-not-given","question":"Most beginner collectors start by buying expensive equipment.","answer":"False","explanation":"The passage says starting a collection ''requires very little equipment''."},
    {"id":"r13q5","type":"fill-blank","question":"The technical name for stamp collecting is ________.","answer":"philately","explanation":"The passage states ''known by the technical name ''philately''''."},
    {"id":"r13q6","type":"short-answer","question":"According to the passage, what are two benefits of focusing on a single theme when collecting stamps?","answer":"It makes the hobby more manageable and more personally meaningful."}
  ]'::jsonb
),

-- r14 ─ Level 1 / food
(
  'r14',
  'Street Food Markets',
  'Level 1',
  'food',
  'https://picsum.photos/seed/reading-streetfood/800/400',
  192,
  12,
  '[
    "Street food markets have grown enormously in popularity over the past two decades. Once considered the food of the poor or the food of busy commuters, street food is now celebrated as an important part of local culture and culinary identity. Cities from Bangkok to London, from Mexico City to Marrakech, attract millions of visitors each year partly because of their vibrant street food scenes.",
    "The appeal of street food lies in its combination of freshness, flavour, and affordability. Unlike restaurant meals, street food is typically prepared in front of the customer, often using recipes that have been passed down through generations. This transparency gives customers confidence in what they are eating and creates an atmosphere of theatre and excitement.",
    "Street food markets also serve an important economic function. Many traders who operate market stalls are small business owners for whom the market provides their primary income. The low start-up costs of a market stall make it an accessible path into entrepreneurship, particularly for people from communities with limited access to business financing.",
    "However, street food markets face challenges. In many cities, increasing pressure on public space means that long-established markets have been forced to relocate or close. Health and safety regulations, while necessary, can be difficult and costly for small traders to comply with. Despite these pressures, street food markets continue to thrive as spaces where food, community, and culture come together."
  ]'::jsonb,
  '[
    {"id":"r14q1","type":"multiple-choice","question":"According to the passage, what are THREE things that make street food appealing?","options":["Packaging, speed, and variety","Freshness, flavour, and affordability","Quality, rarity, and prestige","Price, location, and convenience"],"answer":"B","explanation":"The passage says the appeal lies in its ''combination of freshness, flavour, and affordability''."},
    {"id":"r14q2","type":"true-false-not-given","question":"Street food was once seen as food for wealthy people.","answer":"False","explanation":"The passage says it was ''considered the food of the poor or the food of busy commuters'', not wealthy people."},
    {"id":"r14q3","type":"true-false-not-given","question":"Many street food recipes have been passed down through generations.","answer":"True","explanation":"The passage says street food is ''often using recipes that have been passed down through generations''."},
    {"id":"r14q4","type":"true-false-not-given","question":"All street food markets in cities have managed to stay in their original locations.","answer":"False","explanation":"The passage says some established markets ''have been forced to relocate or close'' due to pressure on public space."},
    {"id":"r14q5","type":"fill-blank","question":"Low ________ costs make market stalls an accessible path into entrepreneurship.","answer":"start-up","explanation":"The passage says ''The low start-up costs of a market stall make it an accessible path into entrepreneurship''."},
    {"id":"r14q6","type":"short-answer","question":"What economic benefit do street food markets provide for small business owners?","answer":"They provide a primary income source with low start-up costs, making entrepreneurship accessible to people with limited access to business financing."}
  ]'::jsonb
),

-- r15 ─ Level 1 / family
(
  'r15',
  'A Weekend with Grandparents',
  'Level 1',
  'family',
  'https://picsum.photos/seed/reading-grandparents/800/400',
  195,
  12,
  '[
    "Every second weekend of the month, eleven-year-old Omar and his younger sister Yasmin travel by train to stay with their grandparents in the small market town of Whitfield. The journey takes just over an hour, and the children travel alone — something that fills them with a sense of independence and quiet pride.",
    "Their grandparents, Grandma Rose and Grandpa Joe, live in a tall terraced house on the high street. The house always smells of baking bread and wood smoke. Grandpa Joe has a large vegetable garden at the back of the house, where he grows tomatoes, courgettes, and runner beans. Omar loves to help him water the plants and pull out weeds on Saturday mornings.",
    "Saturday afternoons are reserved for the market. Grandma Rose knows all the traders by name and always stops for long conversations. Yasmin loves the stall that sells handmade jewellery, and Omar always heads straight for the second-hand bookstall, where the elderly owner lets him browse for as long as he likes.",
    "On Sunday mornings, the whole family makes a large breakfast together. Grandpa Joe cooks scrambled eggs, while Grandma Rose makes her famous honey pancakes. After breakfast, they sit around the kitchen table and talk — about school, about memories, about things that matter. When it is time to leave, Omar always feels a small ache of sadness, but also a warm fullness that stays with him on the train journey home."
  ]'::jsonb,
  '[
    {"id":"r15q1","type":"multiple-choice","question":"How often do Omar and Yasmin visit their grandparents?","options":["Every weekend","Every other weekend","Once a month","Twice a month"],"answer":"B","explanation":"The passage says they go ''every second weekend of the month'', which means every other weekend."},
    {"id":"r15q2","type":"true-false-not-given","question":"The children travel to their grandparents'' house with an adult.","answer":"False","explanation":"The passage says they ''travel alone'', which gives them ''a sense of independence''."},
    {"id":"r15q3","type":"true-false-not-given","question":"Grandpa Joe grows vegetables in the garden.","answer":"True","explanation":"The passage says he ''grows tomatoes, courgettes, and runner beans''."},
    {"id":"r15q4","type":"true-false-not-given","question":"Yasmin prefers the bookstall to the jewellery stall at the market.","answer":"False","explanation":"The passage says Yasmin ''loves the stall that sells handmade jewellery'' and Omar goes to the bookstall."},
    {"id":"r15q5","type":"fill-blank","question":"Grandma Rose makes ________ pancakes on Sunday mornings.","answer":"honey","explanation":"The passage mentions ''Grandma Rose makes her famous honey pancakes''."},
    {"id":"r15q6","type":"short-answer","question":"How does Omar feel when it is time to leave his grandparents'' house?","answer":"He feels a small ache of sadness but also a warm fullness that stays with him on the train journey home."}
  ]'::jsonb
),

-- r16 ─ Level 2 / school
(
  'r16',
  'Why Reading Matters',
  'Level 2',
  'school',
  'https://picsum.photos/seed/reading-books/800/400',
  228,
  15,
  '[
    "In an age dominated by screens and short-form digital content, the habit of reading long-form texts — whether novels, journalism, or non-fiction — is in decline among young people. Yet researchers and educators continue to argue that reading remains one of the most transformative activities a person can engage in. The question is no longer whether reading is beneficial, but whether modern institutions are doing enough to preserve and promote the habit.",
    "The cognitive benefits of reading are well documented. Reading literary fiction, in particular, has been shown to improve ''theory of mind'' — the ability to understand that other people have their own thoughts, emotions, and perspectives. Studies carried out at the University of Toronto found that regular fiction readers score higher on empathy tests and demonstrate greater social intelligence than non-readers. Reading also strengthens concentration, enlarges vocabulary, and builds background knowledge across a wide range of topics.",
    "Beyond cognitive development, reading has been linked to better mental health outcomes. A 2013 study by the University of Sussex found that reading for just six minutes could reduce stress levels by up to 68 percent — more effectively than listening to music or going for a walk. This is thought to occur because reading requires the brain to enter a state of deep focus, temporarily reducing the physical symptoms of stress.",
    "Despite these benefits, access to books remains deeply unequal. Children from lower-income households are less likely to have books at home and less likely to visit libraries regularly. This ''book gap'' has measurable consequences: studies consistently show that children who read for pleasure during childhood outperform their peers academically throughout their school careers. Addressing this inequality requires sustained investment in school libraries, public libraries, and reading support programmes — resources that have been significantly cut in many countries over the past decade."
  ]'::jsonb,
  '[
    {"id":"r16q1","type":"multiple-choice","question":"What does ''theory of mind'' refer to, according to the passage?","options":["The ability to think creatively","The ability to understand others'' thoughts and perspectives","The ability to read quickly","The ability to remember information"],"answer":"B","explanation":"The passage defines it as ''the ability to understand that other people have their own thoughts, emotions, and perspectives''."},
    {"id":"r16q2","type":"true-false-not-given","question":"Reading has been proven to reduce stress more effectively than listening to music.","answer":"True","explanation":"The passage states reading was ''more effectively'' stress-reducing ''than listening to music or going for a walk'' in the cited study."},
    {"id":"r16q3","type":"true-false-not-given","question":"All children have equal access to books and libraries.","answer":"False","explanation":"The passage says ''access to books remains deeply unequal'' and children from lower-income households are less likely to have books at home."},
    {"id":"r16q4","type":"true-false-not-given","question":"The University of Toronto study involved primary school children specifically.","answer":"Not Given","explanation":"The passage mentions the University of Toronto study but does not specify the age group of participants."},
    {"id":"r16q5","type":"fill-blank","question":"Reading for just six minutes can reduce stress levels by up to ________ percent.","answer":"68","explanation":"The passage states ''reading for just six minutes could reduce stress levels by up to 68 percent''."},
    {"id":"r16q6","type":"short-answer","question":"What does the passage suggest should be done to address the inequality in children''s access to books?","answer":"Sustained investment in school libraries, public libraries, and reading support programmes."}
  ]'::jsonb
),

-- r17 ─ Level 2 / daily routine
(
  'r17',
  'Sleep and the Adolescent Brain',
  'Level 2',
  'daily routine',
  'https://picsum.photos/seed/reading-sleep/800/400',
  234,
  15,
  '[
    "Sleep is not a passive state. While the body rests, the brain is engaged in essential maintenance work: consolidating memories, clearing metabolic waste, regulating hormones, and repairing neural connections. For adolescents — those aged roughly between 12 and 18 — adequate sleep is particularly critical, because this is a period of rapid and irreversible brain development.",
    "Research consistently shows that most teenagers are chronically sleep-deprived. The recommended amount of sleep for adolescents is between eight and ten hours per night. However, surveys of teenage sleep habits in the United Kingdom and United States suggest that the average teenager sleeps only around 6.5 to 7 hours. This deficit has real consequences: sleep deprivation impairs attention, working memory, problem-solving ability, and emotional regulation.",
    "Part of the problem is biological. During puberty, the circadian rhythm — the internal body clock that regulates sleep-wake cycles — shifts by approximately two hours. This means that teenagers are not biologically ready to fall asleep until around 11 pm and may not reach peak alertness until mid-morning. A school system that demands students arrive at eight o''clock and concentrate immediately is, in effect, asking them to work against their own biology.",
    "A growing number of researchers and health organisations are calling for secondary schools to adopt later start times. Pilots in the United States have shown promising results: schools that delayed their start time to 8:30 am or later recorded improvements in attendance, academic performance, and student mental health. Critics argue that later starts would disrupt family schedules and reduce time for after-school activities. Proponents counter that these are manageable logistical challenges compared with the measurable harm caused by chronic sleep deprivation."
  ]'::jsonb,
  '[
    {"id":"r17q1","type":"multiple-choice","question":"How many hours of sleep do health experts recommend for teenagers each night?","options":["6 to 7 hours","7 to 8 hours","8 to 10 hours","10 to 12 hours"],"answer":"C","explanation":"The passage says ''The recommended amount of sleep for adolescents is between eight and ten hours per night''."},
    {"id":"r17q2","type":"true-false-not-given","question":"The average teenager in the UK and US sleeps the recommended amount.","answer":"False","explanation":"The passage says the average teenager sleeps ''only around 6.5 to 7 hours'', which is below the recommended 8–10 hours."},
    {"id":"r17q3","type":"true-false-not-given","question":"During puberty, the circadian rhythm shifts by approximately two hours.","answer":"True","explanation":"The passage states ''the circadian rhythm...shifts by approximately two hours'' during puberty."},
    {"id":"r17q4","type":"true-false-not-given","question":"All secondary schools have already adopted later start times.","answer":"False","explanation":"The passage says a ''growing number'' are being called to do so, but it is not universal — it describes pilots and ongoing debates."},
    {"id":"r17q5","type":"fill-blank","question":"Sleep deprivation impairs attention, working memory, problem-solving ability, and emotional ________.","answer":"regulation","explanation":"The passage lists these consequences of sleep deprivation, ending with ''emotional regulation''."},
    {"id":"r17q6","type":"short-answer","question":"What results were seen in US schools that delayed their start time to 8:30 am or later?","answer":"Improvements in attendance, academic performance, and student mental health."}
  ]'::jsonb
),

-- r18 ─ Level 2 / food
(
  'r18',
  'The Rise of Plant-Based Diets',
  'Level 2',
  'food',
  'https://picsum.photos/seed/reading-plantbased/800/400',
  231,
  15,
  '[
    "Over the past decade, plant-based diets have moved from the fringes of food culture to the mainstream. Sales of plant-based meat alternatives have grown by over 40 percent annually in several Western markets, and major fast-food chains now offer vegan options as standard. This shift has been driven by a convergence of concerns: environmental sustainability, animal welfare, and personal health.",
    "The environmental case for reducing meat consumption is compelling. The livestock industry is responsible for approximately 14.5 percent of global greenhouse gas emissions, according to the United Nations Food and Agriculture Organization. It is also a significant driver of deforestation, particularly in South America, where vast areas of forest are cleared to create grazing land or to grow animal feed. A 2018 Oxford University study found that switching to a plant-based diet is ''the single biggest way'' an individual can reduce their environmental impact.",
    "The health evidence is more nuanced. A well-planned plant-based diet can provide all necessary nutrients and has been associated with lower rates of heart disease, type 2 diabetes, and certain cancers. However, poorly planned plant-based diets can lead to deficiencies in vitamin B12, iron, calcium, and omega-3 fatty acids — nutrients that are abundant in animal products. Nutritionists stress that the label ''plant-based'' does not automatically mean healthy: highly processed vegan products can be just as high in salt, sugar, and saturated fat as their meat-based equivalents.",
    "Critics of the plant-based food industry point out that the rapid commercialisation of veganism has led to the proliferation of ultra-processed products that prioritise profit over nutrition. They argue that a diet based on whole, minimally processed foods — whether or not it includes some animal products — may be more beneficial than one built around expensive, heavily marketed substitutes. The debate reflects a broader tension in modern food culture between genuine nutritional science and powerful commercial interests."
  ]'::jsonb,
  '[
    {"id":"r18q1","type":"multiple-choice","question":"According to the UN, what percentage of global greenhouse gas emissions does livestock farming produce?","options":["About 5%","About 10%","About 14.5%","About 25%"],"answer":"C","explanation":"The passage cites the UN FAO figure of ''approximately 14.5 percent of global greenhouse gas emissions''."},
    {"id":"r18q2","type":"true-false-not-given","question":"The Oxford University study found that diet change is the most effective individual action for reducing environmental impact.","answer":"True","explanation":"The passage quotes the study finding it is ''the single biggest way'' an individual can reduce their environmental impact."},
    {"id":"r18q3","type":"true-false-not-given","question":"All plant-based diets are automatically healthy.","answer":"False","explanation":"The passage explicitly states that ''the label ''plant-based'' does not automatically mean healthy''."},
    {"id":"r18q4","type":"true-false-not-given","question":"Vitamin B12 is found in large quantities in most plant foods.","answer":"False","explanation":"The passage says B12 is a nutrient that ''abundant in animal products'', implying it is not easily found in plants."},
    {"id":"r18q5","type":"fill-blank","question":"The livestock industry is a significant driver of ________, particularly in South America.","answer":"deforestation","explanation":"The passage says ''It is also a significant driver of deforestation, particularly in South America''."},
    {"id":"r18q6","type":"short-answer","question":"What argument do critics make against the commercial plant-based food industry?","answer":"They argue that the rapid commercialisation has led to ultra-processed products that prioritise profit over nutrition, and that a diet based on whole, minimally processed foods may be more beneficial."}
  ]'::jsonb
),

-- r19 ─ Level 2 / hobbies
(
  'r19',
  'Music and the Mind',
  'Level 2',
  'hobbies',
  'https://picsum.photos/seed/reading-music/800/400',
  226,
  15,
  '[
    "Music is unique among human activities in its ability to engage almost every region of the brain simultaneously. When a person listens to music they enjoy, the brain releases dopamine — a neurotransmitter associated with pleasure and reward. This explains why music can elevate mood, reduce anxiety, and even temporarily relieve physical pain. Neurologist Oliver Sacks described music as ''the most profound non-chemical experience that activates the brain''s reward system''.",
    "Learning to play a musical instrument has been shown to produce even deeper neurological benefits than passive listening. Studies using brain imaging technology have found that musicians'' brains differ measurably from non-musicians'': the corpus callosum — the bridge connecting the brain''s two hemispheres — is thicker in people who have played an instrument from a young age. This enhanced connectivity is associated with better memory, stronger mathematical reasoning, and more effective language processing.",
    "Music also has a remarkable capacity to reach people with neurological conditions that impair other forms of communication. Patients with severe Alzheimer''s disease who can no longer recognise family members or hold a conversation often respond vividly to familiar music from their past. Researchers believe this occurs because musical memories are stored in brain regions that are relatively resistant to the damage caused by Alzheimer''s. Music therapy is now used in care homes, rehabilitation centres, and mental health settings worldwide.",
    "Despite the well-documented benefits, music education in schools has faced significant budget cuts in many countries over the past two decades. Advocates argue that reducing music provision is short-sighted — not only does it deprive children of the cognitive benefits of musical training, but it also removes one of the few school experiences that combines creativity, discipline, collaboration, and joy."
  ]'::jsonb,
  '[
    {"id":"r19q1","type":"multiple-choice","question":"What does dopamine do, according to the passage?","options":["It regulates blood pressure","It is associated with pleasure and reward","It strengthens the immune system","It improves physical coordination"],"answer":"B","explanation":"The passage says dopamine is ''a neurotransmitter associated with pleasure and reward''."},
    {"id":"r19q2","type":"true-false-not-given","question":"Playing a musical instrument produces stronger brain benefits than simply listening to music.","answer":"True","explanation":"The passage says learning to play ''has been shown to produce even deeper neurological benefits than passive listening''."},
    {"id":"r19q3","type":"true-false-not-given","question":"The corpus callosum connects the brain to the spinal cord.","answer":"False","explanation":"The passage says the corpus callosum is ''the bridge connecting the brain''s two hemispheres'', not the spinal cord."},
    {"id":"r19q4","type":"true-false-not-given","question":"All Alzheimer''s patients respond to music therapy.","answer":"Not Given","explanation":"The passage says patients ''often respond vividly'' but does not claim that all patients respond."},
    {"id":"r19q5","type":"fill-blank","question":"Musical memories are stored in brain regions that are relatively resistant to the damage caused by ________.","answer":"Alzheimer''s","explanation":"The passage explains this as the reason why Alzheimer''s patients can still respond to familiar music."},
    {"id":"r19q6","type":"short-answer","question":"According to the passage, what four things does music education in schools combine?","answer":"Creativity, discipline, collaboration, and joy."}
  ]'::jsonb
),

-- r20 ─ Level 2 / family
(
  'r20',
  'Changing Family Structures',
  'Level 2',
  'family',
  'https://picsum.photos/seed/reading-family-modern/800/400',
  238,
  15,
  '[
    "The concept of ''the family'' has changed dramatically over the past century. In most Western countries in the early twentieth century, the dominant model was the nuclear family: a married man and woman living together with their biological children. Today, this model represents only one of many recognised family structures, and its proportion among all households has declined significantly.",
    "Several social and economic forces have driven this transformation. Rising divorce rates have created more single-parent families and blended families — households in which one or both partners bring children from a previous relationship. Increased female participation in the workforce has altered traditional gender roles, with more households now sharing domestic and financial responsibilities. Legal changes in many countries have made same-sex marriage possible, and advances in reproductive medicine have expanded the range of paths through which people can become parents.",
    "Cross-cultural research suggests that ''family'' is defined differently across the world. In many South and East Asian, African, and Latin American societies, the extended family — including grandparents, aunts, uncles, and cousins — remains the central social unit, with multiple generations often living under the same roof or in very close proximity. In these cultures, individual decisions about education, marriage, and career are frequently made in consultation with the wider family group.",
    "Sociologists note that, despite the diversity of family forms, the fundamental functions of the family remain consistent across cultures: providing economic support, socialising children into cultural norms, offering emotional security, and transmitting values from one generation to the next. The ongoing debate is not about whether the family is declining, but about how well different family structures perform these functions — and how effectively institutions such as schools, healthcare systems, and governments adapt to support an increasingly diverse range of household types."
  ]'::jsonb,
  '[
    {"id":"r20q1","type":"multiple-choice","question":"What is described as the dominant family model in early twentieth-century Western countries?","options":["The extended family","The blended family","The nuclear family","The single-parent family"],"answer":"C","explanation":"The passage says ''the dominant model was the nuclear family: a married man and woman living together with their biological children''."},
    {"id":"r20q2","type":"true-false-not-given","question":"The proportion of nuclear families has increased over the past century.","answer":"False","explanation":"The passage says its proportion ''has declined significantly''."},
    {"id":"r20q3","type":"true-false-not-given","question":"In many Asian and African societies, the extended family remains the central social unit.","answer":"True","explanation":"The passage confirms this for ''many South and East Asian, African, and Latin American societies''."},
    {"id":"r20q4","type":"true-false-not-given","question":"Sociologists believe the family as an institution is disappearing.","answer":"False","explanation":"The passage says ''The ongoing debate is not about whether the family is declining'' — it is not disappearing, but changing in form."},
    {"id":"r20q5","type":"fill-blank","question":"A ________ family is one in which one or both partners bring children from a previous relationship.","answer":"blended","explanation":"The passage defines blended families as ''households in which one or both partners bring children from a previous relationship''."},
    {"id":"r20q6","type":"short-answer","question":"According to the passage, what four functions does the family perform across all cultures?","answer":"Providing economic support, socialising children into cultural norms, offering emotional security, and transmitting values from one generation to the next."}
  ]'::jsonb
)

ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- WRITING LESSONS
-- ─────────────────────────────────────────────────────────────

INSERT INTO public.writing_lessons
  (id, title, level, topic, task_type, word_target, duration_minutes,
   prompt, requirements, suggested_ideas, suggested_vocabulary, suggested_structure)
VALUES

-- w21 ─ Starter / food / descriptive
(
  'w21',
  'A Meal I Love',
  'Starter',
  'food',
  'descriptive',
  80,
  15,
  'Describe a meal that you love. Write about what it is, what it looks and smells like, how it tastes, and who usually makes it for you.',
  '["Write at least 80 words","Name and describe the meal","Describe how it smells and tastes","Write about who makes it or where you eat it"]'::jsonb,
  '["The name of the meal and what country it comes from","The main ingredients","What it looks like on the plate","The taste — is it spicy, sweet, sour, or savoury?","Who cooks it for you, or where you buy it","When you usually eat this meal"]'::jsonb,
  '["delicious","tasty","savoury","spicy","sweet","sour","crispy","tender","fresh","golden","aromatic","steaming","homemade","traditional","recipe","flavour"]'::jsonb,
  '{"introduction":"What is the meal called? Where is it from?","body":["Describe the ingredients and what the meal looks like. What colours and textures can you see?","How does it smell? What does it taste like? Who makes it and when do you eat it?"],"conclusion":"Why is this meal special to you? How do you feel when you eat it?"}'::jsonb
),

-- w22 ─ Starter / school / narrative
(
  'w22',
  'A Day I Remember at School',
  'Starter',
  'school',
  'narrative',
  100,
  20,
  'Write about a day at school that you remember well. Tell the story of what happened, who was there, and explain why you still remember it.',
  '["Write at least 100 words","Tell the events in order","Include at least one other person in the story","Write about how you felt"]'::jsonb,
  '["When did this school day happen?","Why was it different from normal?","Was it a sports day, a trip, a test, or something funny?","Who was with you?","What happened and in what order?","How did you feel at the end of the day?"]'::jsonb,
  '["remember","special","nervous","excited","surprised","proud","embarrassed","funny","unexpected","unforgettable","first","then","after that","suddenly","eventually","finally"]'::jsonb,
  '{"introduction":"Which day are you writing about? When did it happen and where were you?","body":["Describe what happened at the beginning of the day. What was different about it?","What happened next? Who was involved? What was the most memorable moment?"],"conclusion":"How did the day end? How did you feel? Why do you still remember it?"}'::jsonb
),

-- w23 ─ Level 1 / hobbies / opinion
(
  'w23',
  'Are Video Games Good for You?',
  'Level 1',
  'hobbies',
  'opinion',
  150,
  25,
  'Some people believe video games are harmful, while others say they can be educational and fun. What is your opinion? Give clear reasons and examples to support your view.',
  '["Write at least 150 words","State your opinion clearly in the introduction","Give at least two reasons with examples","Acknowledge the opposing point of view"]'::jsonb,
  '["Benefits: problem-solving, teamwork, hand-eye coordination, creativity","Benefits: some games teach history, science, language","Drawbacks: addiction, too much screen time, sleep problems","Drawbacks: violent content, social isolation","The importance of balance and parental guidance","Your personal experience with video games"]'::jsonb,
  '["beneficial","harmful","addiction","balance","educational","interactive","coordinate","competitive","teamwork","strategy","stimulate","limit","moderate","in my opinion","however","on the other hand"]'::jsonb,
  '{"introduction":"Do you think video games are generally good or bad? State your view clearly.","body":["Give your strongest reasons for your opinion. Use specific examples from games you know.","Consider the arguments on the other side. Why do some people disagree with you? How do you respond?"],"conclusion":"What is the most important thing to remember about video games? State your final opinion."}'::jsonb
),

-- w24 ─ Level 1 / family / descriptive
(
  'w24',
  'My Grandparent',
  'Level 1',
  'family',
  'descriptive',
  120,
  20,
  'Write a description of one of your grandparents. Describe what they look like, what their personality is like, what they enjoy doing, and what they mean to you.',
  '["Write at least 120 words","Describe their appearance","Describe their personality with examples","Write about what you do together or what they have taught you"]'::jsonb,
  '["Their name and how old they are","What they look like (height, hair, eyes, the way they dress)","Their personality (kind, funny, strict, wise, patient)","What they love doing (cooking, gardening, telling stories)","A favourite memory you have with them","What they have taught you or given you"]'::jsonb,
  '["wise","patient","gentle","strict","warm","caring","generous","hard-working","proud","traditional","memory","childhood","experience","advice","treasure","inspire"]'::jsonb,
  '{"introduction":"Who is this grandparent? What is their name and what do they mean to you?","body":["Describe what your grandparent looks like and what their personality is like. Give examples.","What do you do together? Share a specific memory or something they have taught you."],"conclusion":"Why is this grandparent special to you? What is the most important thing they have given you?"}'::jsonb
),

-- w25 ─ Level 1 / daily routine / narrative
(
  'w25',
  'A Challenging Day',
  'Level 1',
  'daily routine',
  'narrative',
  150,
  25,
  'Write about a day in your life that was particularly challenging. Describe what made it difficult, how you dealt with the challenges, and what you learned from the experience.',
  '["Write at least 150 words","Describe the challenge clearly","Explain what you did to cope with it","Reflect on what you learned"]'::jsonb,
  '["What kind of challenge was it? (exam, illness, an argument, getting lost)","How did the day start — did you know it would be hard?","What specific obstacles did you face?","Who helped you, if anyone?","What did you do to get through it?","How do you feel looking back on it now?"]'::jsonb,
  '["difficult","stressful","overwhelming","anxious","determined","cope","manage","persevere","support","overcome","exhausted","relieved","grateful","lesson","strength","perspective"]'::jsonb,
  '{"introduction":"When was this challenging day? Set the scene — what was happening in your life at the time?","body":["Describe the main challenge or challenges you faced. How did you feel? What was going through your mind?","What did you do to deal with the situation? Did anyone help you? Was there a turning point?"],"conclusion":"How did the day end? What did you learn about yourself? Would you handle it differently now?"}'::jsonb
),

-- w26 ─ Level 2 / school / opinion
(
  'w26',
  'Should Schools Teach Financial Literacy?',
  'Level 2',
  'school',
  'opinion',
  200,
  30,
  'Financial literacy — the ability to understand and manage money — is not taught as a subject in most schools. Do you think it should be? Write a well-argued essay giving your view, supported by reasons and examples.',
  '["Write at least 200 words","Present a clear thesis in the introduction","Discuss at least three points","Address counter-arguments with responses","Use formal, academic-style language"]'::jsonb,
  '["Why financial literacy matters: debt, savings, budgeting, investment","The gap between school knowledge and real-world money skills","Arguments for: young people make poor financial decisions, student debt crisis","Arguments for: schools already teach practical life skills","Arguments against: parents should teach this at home, limited curriculum time","Arguments against: difficult to make the content engaging for teenagers","Your conclusion: what should be taught and at what age?"]'::jsonb,
  '["financial literacy","budgeting","debt","investment","curriculum","essential","practical","equip","neglect","consequence","introduce","compulsory","advocate","moreover","nevertheless","in light of"]'::jsonb,
  '{"introduction":"Introduce the concept of financial literacy and the current gap in school curricula. State your thesis.","body":["Argue your main point: why should (or should not) schools teach financial literacy? Provide evidence and examples.","Discuss the counter-arguments. What do critics say? How do you respond to their concerns?","Give a third point or consider the wider implications — who benefits most from this change?"],"conclusion":"Restate your position. What specific financial topics should schools cover, and how could they make it effective?"}'::jsonb
),

-- w27 ─ Level 2 / hobbies / descriptive
(
  'w27',
  'A Sport or Activity I Love',
  'Level 2',
  'hobbies',
  'descriptive',
  200,
  30,
  'Write a detailed description of a sport or physical activity that you love. Describe how it is played or practised, the physical and mental demands it places on you, and the reasons why you are so passionate about it.',
  '["Write at least 200 words","Describe the activity in enough detail for someone unfamiliar with it","Discuss both physical and mental challenges","Include a personal reflection on what this activity means to you"]'::jsonb,
  '["What the activity is and a brief history or background","The basic rules or structure of the activity","The physical demands: strength, speed, coordination, endurance","The mental demands: concentration, strategy, resilience","Your personal journey with this activity — when you started, how you improved","A specific moment when the activity made you feel proud or alive","Why you would recommend it to others"]'::jsonb,
  '["discipline","technique","endurance","precision","coordination","strategy","resilience","competitive","achievement","passion","dedication","adrenaline","momentum","instinct","exhilarating","pursue"]'::jsonb,
  '{"introduction":"What is the activity? Briefly introduce it and explain when and how you became involved.","body":["Describe how the activity works and what it demands physically. Use vivid, specific language.","What are the mental challenges? How has this activity tested your mind as well as your body?","Share a specific personal memory or achievement connected to this activity."],"conclusion":"What does this activity mean to you? How has it shaped you as a person? Why would you recommend it?"}'::jsonb
),

-- w28 ─ Level 2 / family / narrative
(
  'w28',
  'A Family Celebration',
  'Level 2',
  'family',
  'narrative',
  200,
  30,
  'Write about a family celebration or gathering that you remember vividly. Tell the story of what happened, describe the atmosphere and the people involved, and reflect on why this occasion was significant to you.',
  '["Write at least 200 words","Tell the story with a clear beginning, middle, and end","Use descriptive language to bring the scene to life","Include your thoughts and feelings throughout","Reflect on the significance of this occasion"]'::jsonb,
  '["What was the occasion? (birthday, wedding, New Year, Eid, Lunar New Year, etc.)","Where did it take place and who was there?","What did the place look, sound, and smell like?","What were the key moments — the food, the conversations, the activities?","Was there a funny, emotional, or unexpected moment?","How did the celebration make you feel about your family?"]'::jsonb,
  '["gather","celebrate","occasion","tradition","laughter","embrace","reminisce","atmosphere","vibrant","nostalgic","overwhelming","cherish","significance","togetherness","heritage","mark"]'::jsonb,
  '{"introduction":"Set the scene: what was the occasion, where was it, and who was there? Create an immediate sense of atmosphere.","body":["Describe the preparations and the arrival of family members. Build up to the main event.","Describe the highlight of the celebration in vivid detail. Include sights, sounds, smells, and dialogue if appropriate.","Was there an emotional or unexpected moment? How did it affect you and the people around you?"],"conclusion":"How did the celebration end? Why does this occasion stand out in your memory? What did it teach you about your family?"}'::jsonb
),

-- w29 ─ Level 2 / daily routine / compare-contrast
(
  'w29',
  'Online Learning vs the Traditional Classroom',
  'Level 2',
  'daily routine',
  'compare-contrast',
  200,
  30,
  'Compare and contrast online learning with traditional classroom learning. Discuss the key differences and similarities in terms of flexibility, social interaction, effectiveness, and accessibility. Conclude with your own view on which is more suitable for most learners.',
  '["Write at least 200 words","Discuss at least three clear points of comparison","Use language for comparing and contrasting","Support each point with specific examples","Give a clear personal conclusion"]'::jsonb,
  '["Flexibility: online learning can be done anywhere, at any time vs fixed school schedule","Social interaction: face-to-face relationships vs screen-based communication","Effectiveness: self-discipline needed online vs structured teacher-led learning","Access: online can reach remote learners vs requires physical infrastructure","Cost: online can be cheaper vs school fees and commuting","The COVID-19 pandemic as a real-world test of both models","What kind of learner benefits most from each approach"]'::jsonb,
  '["flexibility","self-discipline","engagement","interaction","accessible","synchronous","asynchronous","structured","autonomous","collaborate","distraction","feedback","infrastructure","complement","whereas","in contrast"]'::jsonb,
  '{"introduction":"Introduce both models of learning briefly. State that you will compare them across several key areas.","body":["Compare the two in terms of flexibility and scheduling. Which approach suits different types of learners?","Compare them in terms of social interaction and the student-teacher relationship. What is lost or gained in each?","Compare their effectiveness and accessibility. Under what conditions does each model perform best?"],"conclusion":"Which model do you think is more suitable for the majority of learners and why? Is a blended approach the best solution?"}'::jsonb
),

-- w30 ─ Level 2 / food / opinion
(
  'w30',
  'Fast Food and Modern Life',
  'Level 2',
  'food',
  'opinion',
  200,
  30,
  'Fast food has become a dominant part of modern eating habits around the world. Do you think the rise of fast food culture has been more harmful or more beneficial to society? Argue your view with evidence and examples.',
  '["Write at least 200 words","State a clear thesis in the introduction","Discuss at least three points","Present evidence and specific examples","Address counter-arguments","Conclude with a considered opinion"]'::jsonb,
  '["Benefits: convenience and affordability, job creation, globalisation of food culture","Benefits: innovation in food production and supply chains","Harms: link to obesity, type 2 diabetes, and cardiovascular disease","Harms: environmental cost (packaging waste, factory farming, food miles)","Harms: threat to local food cultures and traditional cooking","The marketing of fast food to children","Whether personal responsibility or regulation is the answer"]'::jsonb,
  '["convenience","affordable","addiction","obesity","nutrition","processed","regulate","corporation","sustainability","contribute","consequence","undermine","exploit","epidemic","acknowledge","conclude"]'::jsonb,
  '{"introduction":"Describe the global rise of fast food. State whether you believe it has been more harmful or beneficial overall.","body":["Present your strongest argument. Use statistics or real-world examples to support it.","Discuss a second major point — consider the environmental or cultural impact.","Acknowledge the strongest argument on the opposing side and respond to it."],"conclusion":"Restate your thesis in different words. What should individuals, governments, or the food industry do differently?"}'::jsonb
)

ON CONFLICT (id) DO NOTHING;
