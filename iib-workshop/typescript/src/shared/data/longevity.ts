import type { AgDataSourcesDefinition } from 'ag-studio';

import type { AppRegistry } from '../widgets/types';

export const LONGEVITY_SOURCE = 'longevity';
export const LONGEVITY_EVIDENCE_SOURCE = 'longevityEvidence';
export const LONGEVITY_LINKS_SOURCE = 'longevityLinks';

/**
 * Live Long & Prosper: Information is Beautiful's longevity dataset, from the book Knowledge
 * is Beautiful (2014).
 *
 * GENERATED FILE - do not edit by hand. Regenerate with:
 *   node scripts/build-longevity-source.mjs
 *
 * Read from https://docs.google.com/spreadsheets/d/1OdddTttI2l47SIgH0VW-q4XfHNJRa6bMbNHL8N4edU8, joining its cleaned tab to the
 * original. See the script for which column comes from which tab.
 */
export const longevityData: AgDataSourcesDefinition<AppRegistry> = {
    sources: [
        {
            id: LONGEVITY_SOURCE,
            name: 'Longevity Interventions',
            description:
                'One row per habit, trait or circumstance - 35 in all - with the years of life it adds or costs on average. The table to start from.',
            data: [
                {
                    interventionId: 1,
                    intervention: 'Smoking',
                    yearsGainedOrLost: -10,
                    yearsAsPublished: '-10',
                    effect: 'Costs years',
                    evidenceStrength: 'Strong',
                    sexesAffected: 'Both',
                    note: '10 years gained (against those who continue to smoke) if you quit smoking between the ages of 25 and 24; 5 years gained if you quit smoking between the ages of 45 and 59',
                    evidenceDetail:
                        '14 if combined with exercise and eating healthy; HOWEVER those who quit smoking before they turn 35 can gain most if not all of that decade back, and even those who wait until middle age to kick the habit can add about five years back to their life expectancies.',
                    sources:
                        'Khaw KT, et al. (2008). Combined impact of health behaviours and mortality in men and women: the EPIC Norfolk prospective population study. PLoS Medicine 5(1), 39–47.',
                },
                {
                    interventionId: 2,
                    intervention: 'Sitting Down',
                    yearsGainedOrLost: -3,
                    yearsAsPublished: '-3',
                    effect: 'Costs years',
                    evidenceStrength: 'Suggestive',
                    sexesAffected: 'Both',
                    note: 'for 8-11 hours sitting a day',
                    evidenceDetail:
                        'No matter how much you exercise, sitting too much raises your risk of death. Regardless of whether you’re exercising for 5 hours a week, the fact that you’re sitting for the rest raises the risk of death: you can’t outrun your desk job. Compared to 4 hours per day of sitting, mortality rates for 4-8 sitting hours/day were 3.96% higher, 8-11 sitting h/d were 28% higher, 11+ sitting hours/day were 68.57% higher, regardless of the amount of exercise done.',
                    sources: 'Sydney School of Public Health research paper (2012)',
                },
                {
                    interventionId: 3,
                    intervention: 'Too much sleeping',
                    yearsGainedOrLost: -1.5,
                    yearsAsPublished: '-1.5',
                    effect: 'Costs years',
                    evidenceStrength: 'Suggestive',
                    sexesAffected: 'Both',
                    note: '7 hours ideal, no more than 8 hrs a night',
                    evidenceDetail:
                        "Averaging more than 8 hours sleep a night will increase your chances of dying within 6 years by 13-15%, than if you average 7 hours a night. 7 hours sleep = the 'safest'; but sleeping for five hours a night is less risky than eight; the average sleep time in the western world is now 6.5 hours",
                    sources: 'New Scientist',
                },
                {
                    interventionId: 4,
                    intervention: 'More Optimism',
                    yearsGainedOrLost: 2,
                    yearsAsPublished: '2',
                    effect: 'Adds years',
                    evidenceStrength: 'Suggestive',
                    sexesAffected: 'Female',
                    note: '& faith in fellow humans. calc takes average % of optimism / lack of cynicism',
                    evidenceDetail:
                        'Women within the highest 25% of optimism scores had a 9% lower chance of developing heart disease and a 14% lower chance of dying of any cause. Women with the highest degree of cynical hostility were 16% more likely to die than those with the most trust in their fellow humans.',
                    sources:
                        'Source: Hilary A. Tindle, M.D., assistant professor, medicine, University of Pittsburgh; Suzanne Steinbaum, M.D., director, woman and heart disease, Lenox Hill Hospital, New York City; Aug. 10, 2009, Circulation',
                },
                {
                    interventionId: 5,
                    intervention: 'More Pets',
                    yearsGainedOrLost: 3,
                    yearsAsPublished: '3',
                    effect: 'Adds years',
                    evidenceStrength: 'Good',
                    sexesAffected: 'Both',
                    note: 'particularly for elderly. calc assumes that heart attack would cause death',
                    evidenceDetail:
                        "(1) Cats - According to a study by the Minnesota Stroke Institute that followed more than 4,000 cat owners over 10 years, owning a cat can dramatically reduce a person's chance of dying from heart disease [source: Mundell]. Specifically, people who owned cats were 30 percent less likely to suffer a heart attack. (2) It has also been found that pets in general can help older people and patients recovering from major illness",
                    sources: 'Medical News Today; National Center for Biotechnology Information',
                },
                {
                    interventionId: 6,
                    intervention: 'More professional responsibility',
                    yearsGainedOrLost: 3.5,
                    yearsAsPublished: '3.5',
                    effect: 'Adds years',
                    evidenceStrength: 'Suggestive',
                    sexesAffected: 'Male',
                    note: 'higher and managerial professionals live longer from age 65+ compare to those with "routine" work',
                    evidenceDetail:
                        'At age 65, LE of males (2002-06) classified by occupation as “Higher managerial and professional” was 18.8 years compared with 15.3 years for those assigned to occupations classifies as “Routine”',
                    sources: 'Longevity Science Advisory Panel',
                },
                {
                    interventionId: 7,
                    intervention: 'Healthy Eating',
                    yearsGainedOrLost: 7,
                    yearsAsPublished: '7',
                    effect: 'Adds years',
                    evidenceStrength: 'Strong',
                    sexesAffected: 'Both',
                    note: 'Japanese / Mediterannean diet will lengthen life & reduce risks of cancer. calc applies to mediterannean diet only',
                    evidenceDetail:
                        'Figure given for Mediterannean diet. JAPANESE: A diet comprising one-third less than the recommended 2,300 calories and meals including fish, vegetables and soya products, was cited as the reason for a high life expectancy on the Japanese island of Okinawa, where the world’s highest number of people over 90 live. MEDITERANNEAN: In people ages 70–90, eating a Mediterranean-style diet and greater physical activity are associated with 65–73% lower rates of all-cause mortality, as well as mortality due to CHD, CVD and cancer.',
                    sources:
                        "Amazon (book) The Okinawa Program : How the World's Longest-Lived People Achieve Everlasting Health (2002); American Heart Association (2009)",
                },
                {
                    interventionId: 8,
                    intervention: 'Red Meat',
                    yearsGainedOrLost: -1,
                    yearsAsPublished: '-1',
                    effect: 'Costs years',
                    evidenceStrength: 'Good',
                    sexesAffected: 'Both',
                    note: null,
                    evidenceDetail:
                        'risk of dying in a given year increases by 13% if diet has a high red meat content. argues that eating burger has equivalent life-shortening effects as smoking 2 cigarettes a day.',
                    sources: 'BBC News',
                },
                {
                    interventionId: 9,
                    intervention: 'Alcohol (heavy abuse)',
                    yearsGainedOrLost: -11,
                    yearsAsPublished: '-11',
                    effect: 'Costs years',
                    evidenceStrength: 'Good',
                    sexesAffected: 'Both',
                    note: 'a lot is bad',
                    evidenceDetail: 'Alcoholism reduces life expectancy by about 10 - 12 years.',
                    sources: 'New York Times',
                },
                {
                    interventionId: 10,
                    intervention: 'City living',
                    yearsGainedOrLost: -2.5,
                    yearsAsPublished: '-2.5',
                    effect: 'Costs years',
                    evidenceStrength: 'Suggestive',
                    sexesAffected: 'Both',
                    note: 'or living near a busy road',
                    evidenceDetail:
                        'According to a Canada’s McMaster University study, just living next to a busy road could knock 2.5 years off your life due to increased exposure to traffic air pollution',
                    sources: '2004 study by Murray Finkelstein @ Canada McMaster University',
                },
                {
                    interventionId: 11,
                    intervention: 'Mental Illness',
                    yearsGainedOrLost: -25,
                    yearsAsPublished: '-25',
                    effect: 'Costs years',
                    evidenceStrength: 'Strong',
                    sexesAffected: 'Both',
                    note: 'severe',
                    evidenceDetail:
                        'Study found that those with severe mental illness are two to three times more likely to have chronic medical conditions and have a 25-year shorter life expectancy on average than the general population',
                    sources:
                        'Joseph Parks, director of psychiatric services for the Missouri Department of Mental Health.',
                },
                {
                    interventionId: 12,
                    intervention: 'Obesity',
                    yearsGainedOrLost: -8.5,
                    yearsAsPublished: '-8.5',
                    effect: 'Costs years',
                    evidenceStrength: 'Strong',
                    sexesAffected: 'Both',
                    note: null,
                    evidenceDetail:
                        'In one study, US 18 year olds with a BMI above 35 had a life expectancy reduced by five to 12 years depending on race, sex, and whether or not the person smoked. The largest reduction in life expectancy occurred for white male smokers.',
                    sources: 'NIH News',
                },
                {
                    interventionId: 13,
                    intervention: 'More Health Checks #2',
                    yearsGainedOrLost: 0.14,
                    yearsAsPublished: '0.14',
                    effect: 'Adds years',
                    evidenceStrength: 'Good',
                    sexesAffected: 'Both',
                    note: 'preventative health screening in 30-49 year olds',
                    evidenceDetail:
                        'Preventive health screening and consultation in primary care in 30- to 49-year-olds produce significantly better life expectancy without extra direct and total costs over a six-year follow-up period.',
                    sources: 'National Center for Biotechnology Information',
                },
                {
                    interventionId: 14,
                    intervention: 'Living at high altitude',
                    yearsGainedOrLost: 2,
                    yearsAsPublished: '0.5-3.6',
                    effect: 'Adds years',
                    evidenceStrength: 'Strong',
                    sexesAffected: 'Both (especially men)',
                    note: 'compared to living at sea-level. 0.5-2.5 for women, 1.2-3.6 for men.',
                    evidenceDetail:
                        '"Lower oxygen levels turn on certain genes and we think those genes may change the way heart muscles function. They may also produce new blood vessels that create new highways for blood flow into the heart, also increased solar radiation at altitude helps the body better synthesize vitamin D which has also been shown to have beneficial effects on the heart and some kinds of cancer.." mountain village residents had lower death rates, and lower rates of death from heart disease, than their peers in the lowlands; concluded that high altitude enables the body to cope with lower levels of oxygen & made for a healthier heart.',
                    sources:
                        'based on a study by University of Athens Medical School in Journal of Epidemiology and Community Health, March 2005; BBC News',
                },
                {
                    interventionId: 15,
                    intervention: 'Good marriage',
                    yearsGainedOrLost: 10,
                    yearsAsPublished: '10',
                    effect: 'Adds years',
                    evidenceStrength: 'Good',
                    sexesAffected: 'Both',
                    note: null,
                    evidenceDetail:
                        'Having a spouse can decrease your risk for dying from cancer as much as knocking ten years off your life. Single people spend longer in the hospital, and have a greater risk of dying after surgery',
                    sources:
                        "Linda Waite, university of chicago, 'The Case for Marriage: Why Married People Are Happier, Healthier, and Better off Financially'",
                },
                {
                    interventionId: 16,
                    intervention: 'Less Food',
                    yearsGainedOrLost: 11.67,
                    yearsAsPublished: '11.67',
                    effect: 'Adds years',
                    evidenceStrength: 'Suggestive',
                    sexesAffected: 'Both',
                    note: '30% less calories increases primate and rat life. assumes humans affected same way as monkeys',
                    evidenceDetail:
                        'shown to increase rhesus monkey lifespans by 10-20% (4 years); the most striking extensions of life span occur when put on the diet from birth.',
                    sources: 'New Scientist; New York Times',
                },
                {
                    interventionId: 17,
                    intervention: 'More Meditation',
                    yearsGainedOrLost: 12,
                    yearsAsPublished: '12',
                    effect: 'Adds years',
                    evidenceStrength: 'Suggestive',
                    sexesAffected: 'Both',
                    note: 'as well as Yoga / Tai Chi - as relaxation exercises they all reduce health risks in older people',
                    evidenceDetail:
                        'A study of 2,000 seniors found that those who did relaxation exercises daily had 87% fewer heart attacks than is normal for their age group; 55% fewer cancerous tumors; & 87% fewer nervous disorders.',
                    sources: "Marmot M (2005) 'Social determinants of longevity and mortality'",
                },
                {
                    interventionId: 18,
                    intervention: 'Avoid heart disease',
                    yearsGainedOrLost: 13,
                    yearsAsPublished: '13',
                    effect: 'Adds years',
                    evidenceStrength: 'Suggestive',
                    sexesAffected: 'Both',
                    note: null,
                    evidenceDetail:
                        '- Eliminating heart disease would increase life expectancy at birth by nearly 13 years for those who would otherwise have died of heart disease. - Elimination of heart disease would increase life expectancy at birth by nearly 5 years for whole population i.e. a person aged 50 years would expect to live an additional 4.63 years if heart disease were eliminated as a cause of death.',
                    sources: 'Centres for Disease Control & Prevention',
                },
                {
                    interventionId: 19,
                    intervention: 'A lifestyle of non-smoking, exercising, and healthy eating',
                    yearsGainedOrLost: 14,
                    yearsAsPublished: '14',
                    effect: 'Adds years',
                    evidenceStrength: 'Strong',
                    sexesAffected: 'Both',
                    note: null,
                    evidenceDetail:
                        'study of 20,244 men and women aged 45–79 found that 4 health behaviours (non-smoking / physically active / healthy eating / moderate alcohol intake) had an estimated impact on mortality equivalent to 14 y in chronological age',
                    sources:
                        'Khaw KT, et al. (2008). Combined impact of health behaviours and mortality in men and women: the EPIC Norfolk prospective population study. PLoS Medicine 5(1), 39–47.',
                },
                {
                    interventionId: 20,
                    intervention: 'Spending more time with women',
                    yearsGainedOrLost: 15,
                    yearsAsPublished: '15',
                    effect: 'Adds years',
                    evidenceStrength: 'Suggestive',
                    sexesAffected: 'Male',
                    note: 'in formative years of secondary / high school',
                    evidenceDetail:
                        "Study found significant positive relationship between a man's life expectancy and the sex ratio of the secondary school he attended (i.e. higher % of females). Found that the average white American male who was 65 in 1993 could expect to live another 15 years having spent time around women at school.",
                    sources: 'Economist',
                },
                {
                    interventionId: 21,
                    intervention: 'Avoid Cancer',
                    yearsGainedOrLost: 15,
                    yearsAsPublished: '15',
                    effect: 'Adds years',
                    evidenceStrength: 'Suggestive',
                    sexesAffected: 'Both',
                    note: null,
                    evidenceDetail:
                        'gain in life expectancy at birth for those individuals who would have died of cancer = 15 years. The gains in life expectancy due to the elimination of cancer as a cause of death are then 3.35 years at birth and 3.12 years at age 50 - this is a gain in life expectancy spread across the WHOLE population though.',
                    sources: 'Centres for Disease Control & Prevention',
                },
                {
                    interventionId: 22,
                    intervention: 'More Exercise',
                    yearsGainedOrLost: 2,
                    yearsAsPublished: '2',
                    effect: 'Adds years',
                    evidenceStrength: 'Strong',
                    sexesAffected: 'Both',
                    note: '150 minutes a week of moderate-intensity, leisure time exercise',
                    evidenceDetail:
                        'Researchers from the National Cancer Institute, Harvard Medical School. Another study has shown that lots of physical activity combined with frequently eating nuts, not eating meat and maintaining a stable weight can lengthen life by 1.5 - 2.5 years. In a large US study, brisk walking for 450+ min/wk) increased life expectancy by 4.5 years compared to those who did no activity. Being active—having a physical activity level at or above the WHO-recommended minimum of 150 minutes of brisk walking per week—was associated with an overall gain of life expectancy of 3.4–4.5 years.',
                    sources: 'CBS; Harvard Health Publication: Living to 100',
                },
                {
                    interventionId: 23,
                    intervention: 'A little alcohol',
                    yearsGainedOrLost: 2,
                    yearsAsPublished: '2',
                    effect: 'Adds years',
                    evidenceStrength: 'Suggestive',
                    sexesAffected: 'Male',
                    note: 'a little is fine',
                    evidenceDetail:
                        'gain 2 years by consuming less than 2 units of alcohol a day (roughly just under 1 pint of lager) against someone who completely abstains from drinking.',
                    sources: 'Guardian; Wikipedia (units)',
                },
                {
                    interventionId: 24,
                    intervention: 'More conscientious & stable',
                    yearsGainedOrLost: 2.5,
                    yearsAsPublished: '2.5',
                    effect: 'Adds years',
                    evidenceStrength: 'Suggestive',
                    sexesAffected: 'Both',
                    note: 'as opposed to taking risks',
                    evidenceDetail:
                        'Traits that mark people as conscientious: thinking things through before acting, being dependable in following through on their commitments, adopting conventional norms of morality and being neat and orderly.',
                    sources:
                        "Kern et al (2008) 'Do conscientious individuals live longer? A quantitative review.'; New York Times; 'Personality Predictors of Longevity: Activity, Emotional Stability, and Conscientiousness' (2008)",
                },
                {
                    interventionId: 25,
                    intervention: 'Orgasms',
                    yearsGainedOrLost: 4,
                    yearsAsPublished: '4',
                    effect: 'Adds years',
                    evidenceStrength: 'Suggestive',
                    sexesAffected: 'Male',
                    note: null,
                    evidenceDetail:
                        'Dr Roizen - "The typical man who has 350 orgasms a year, versus the national average of around a quarter of that, lives about four years longer." And more than those extra four years, Roizen says, the men will feel eight years younger than their contemporaries.',
                    sources: "Men's Journal; Revista Mexicana de Anestesiología",
                },
                {
                    interventionId: 26,
                    intervention: 'A little wine',
                    yearsGainedOrLost: 5,
                    yearsAsPublished: '5',
                    effect: 'Adds years',
                    evidenceStrength: 'Suggestive',
                    sexesAffected: 'Male',
                    note: 'a little wine is fine',
                    evidenceDetail:
                        'gain 5 years by consuming less than 2 units of wine a day (half a glass, or 175ml) against those who completely abstain from drinking',
                    sources: 'Guardian; Wikipedia (units)',
                },
                {
                    interventionId: 27,
                    intervention: 'More Money',
                    yearsGainedOrLost: 7.5,
                    yearsAsPublished: '5-10',
                    effect: 'Adds years',
                    evidenceStrength: 'Good',
                    sexesAffected: 'Both',
                    note: 'as opposed to not having much',
                    evidenceDetail:
                        "On average, poorer people in the UK become ill and die five to ten years earlier than their more privileged counterparts, in effect 'ageing' more quickly.",
                    sources:
                        'Perlman RL (2008). Socioeconomic inequalities in ageing and health. Lancet 372, S34–S39. Fries JF (1980). ; Ageing, natural death and the compression of morbidity and health in the elderly. New England Journal of Medicine 313, 407–428.',
                },
                {
                    interventionId: 28,
                    intervention: 'Being a woman',
                    yearsGainedOrLost: 5.1,
                    yearsAsPublished: '5.1',
                    effect: 'Adds years',
                    evidenceStrength: 'Good',
                    sexesAffected: 'Female',
                    note: null,
                    evidenceDetail: 'US, 2006 - difference between male and female life expectancy was 5.1 years',
                    sources: 'Centres for Disease Control & Prevention',
                },
                {
                    interventionId: 29,
                    intervention: 'More close Friends',
                    yearsGainedOrLost: 5.3,
                    yearsAsPublished: '5.3',
                    effect: 'Adds years',
                    evidenceStrength: 'Suggestive',
                    sexesAffected: 'Both',
                    note: '& strong social relationships. based on calc (50% = 5.3 years)',
                    evidenceDetail:
                        'people with stronger social relationships had a 50% increased likelihood of survival than those with weaker social relationships. loneliness as bad for you as smoking 15 cigarettes a day',
                    sources: 'Guardian; Plos Medicine',
                },
                {
                    interventionId: 30,
                    intervention: 'Greater Faith (churchgoing)',
                    yearsGainedOrLost: 7,
                    yearsAsPublished: '7',
                    effect: 'Adds years',
                    evidenceStrength: 'Suggestive',
                    sexesAffected: 'Both (especially women)',
                    note: "studies show it does and also doesn't, perhaps remaining active with the church",
                    evidenceDetail:
                        'Research conducted partly at the University of Colorado at Boulder has found that regular churchgoers live longer than people who seldom or never attend worship services. Life expectancy beyond age 20 averages another 55.3 years, to age 75, for those who never attend church compared to another 62.9 years, age 83, for those who go more than once a week.',
                    sources: "Science Daily; Demography (1999) 'Religious involvement and adult mortality'",
                },
                {
                    interventionId: 31,
                    intervention: 'Country living',
                    yearsGainedOrLost: 8,
                    yearsAsPublished: '8',
                    effect: 'Adds years',
                    evidenceStrength: 'Suggestive',
                    sexesAffected: 'Both',
                    note: 'compared to living next to a busy road',
                    evidenceDetail:
                        'Countryside dwellers have a life expectancy of 84 years, as opposed to 76 for townies.',
                    sources: '2004 study by Murray Finkelstein @ Canada McMaster University',
                },
                {
                    interventionId: 32,
                    intervention: 'Polygamy',
                    yearsGainedOrLost: 9.3,
                    yearsAsPublished: '9.3',
                    effect: 'Adds years',
                    evidenceStrength: 'Suggestive',
                    sexesAffected: 'Male',
                    note: 'polygamy',
                    evidenceDetail: '12% increase, compared to average lifespan',
                    sources: 'New Scientist',
                },
                {
                    interventionId: 33,
                    intervention: 'Good genetics',
                    yearsGainedOrLost: 5,
                    yearsAsPublished: 'large',
                    effect: 'Adds years',
                    evidenceStrength: 'Strong',
                    sexesAffected: 'Both',
                    note: 'if your siblings live to 100, you will be more likely to do the same',
                    evidenceDetail:
                        'Professor Louis Kunkel, who led the study team, said that it was 95% likely that so many of their siblings sharing these was not simply an accident of chance. He said: "It is clear to us that longevity has a genetic component. Frequently if there is one sibling who has lived to be 100, there will be a second or third sibling who also will live to be 100.',
                    sources: 'Havard Gazette',
                },
                {
                    interventionId: 34,
                    intervention: 'A little exercise',
                    yearsGainedOrLost: 2,
                    yearsAsPublished: '2',
                    effect: 'Adds years',
                    evidenceStrength: 'Strong',
                    sexesAffected: 'Both',
                    note: '10 minutes a week',
                    evidenceDetail:
                        'Activities like gardening, walking, or dancing in a non-vigorous, leisurely way for 10 minutes to an hour per week was associated with an 18-percent lower risk of death compared to people who did nothing',
                    sources: 'British Medical Journal',
                },
                {
                    interventionId: 35,
                    intervention: 'Pets - dogs',
                    yearsGainedOrLost: 3,
                    yearsAsPublished: 'not given',
                    effect: 'Adds years',
                    evidenceStrength: 'Strong',
                    sexesAffected: 'Both',
                    note: null,
                    evidenceDetail:
                        'Dog ownership associated with longer life, especially among heart attack and stroke survivors. Researchers reviewed patient data of over 3.8 million people taken from 10 separate studies for a composite meta-analysis study, and found dog owners experienced: 24% reduced risk of all-cause mortality 65% reduced risk of mortality after heart attack 31% reduced risk of mortality due to cardiovascular-related issues. The lower risk of death associated with dog ownership could be explained by an increase in physical activity and the decreased depression and loneliness.',
                    sources: 'Industrial Safety and Hygiene News',
                },
            ],
            fields: [
                {
                    id: 'interventionId',
                    name: 'Intervention ID',
                    format: 'integerFormat',
                    description: 'Joins to Longevity Source Links. Not a quantity: never sum it.',
                },
                { id: 'intervention', name: 'Intervention', format: 'textFormat' },
                {
                    id: 'yearsGainedOrLost',
                    name: 'Years Gained or Lost',
                    format: 'decimalFormat',
                    // Half-years are real (-1.5, 3.5) but most figures are whole, and the default
                    // decimal pattern renders every one of those as 15.00.
                    formatOptions: { format: '#,##0.##' },
                    description:
                        "Average change in life expectancy, in years. Negative means years lost. Where the study gave a range or no figure, this is the dataset author's estimate; Years (as published) has the original.",
                },
                {
                    id: 'yearsAsPublished',
                    name: 'Years (as published)',
                    format: 'textFormat',
                    description:
                        'The figure as the source stated it, including ranges such as 5-10. Text, not a number.',
                },
                {
                    id: 'effect',
                    name: 'Effect',
                    format: 'textFormat',
                    description: 'Adds years or Costs years, from the sign of Years Gained or Lost.',
                },
                {
                    id: 'evidenceStrength',
                    name: 'Evidence Strength',
                    format: 'textFormat',
                    description:
                        'Strong, Good or Suggestive. Joins to Longevity Evidence Levels, which holds the score.',
                },
                { id: 'sexesAffected', name: 'Sexes Affected', format: 'textFormat' },
                {
                    id: 'note',
                    name: 'Note',
                    format: 'textFormat',
                    description: 'The condition the figure applies to, such as "for 8-11 hours sitting a day".',
                },
                { id: 'evidenceDetail', name: 'Evidence Detail', format: 'textFormat' },
                { id: 'sources', name: 'Sources', format: 'textFormat' },
            ],
        },
        {
            id: LONGEVITY_EVIDENCE_SOURCE,
            name: 'Longevity Evidence Levels',
            description:
                "How strong the science behind each intervention is: one row per level, with the dataset's own score. Joined to Longevity Interventions on Evidence Strength.",
            data: [
                {
                    evidenceStrength: 'Strong',
                    evidenceScore: 3,
                },
                {
                    evidenceStrength: 'Good',
                    evidenceScore: 2,
                },
                {
                    evidenceStrength: 'Suggestive',
                    evidenceScore: 1,
                },
            ],
            fields: [
                { id: 'evidenceStrength', name: 'Evidence Strength', format: 'textFormat' },
                {
                    id: 'evidenceScore',
                    name: 'Evidence Score (1-3)',
                    format: 'integerFormat',
                    description: '3 is Strong, 2 Good, 1 Suggestive. Average it rather than summing it.',
                },
            ],
        },
        {
            id: LONGEVITY_LINKS_SOURCE,
            name: 'Longevity Source Links',
            description:
                'Every link cited, one row each - 60 across the 35 interventions. Joined to Longevity Interventions on Intervention ID, so count rows here for how many sources back each one.',
            data: [
                {
                    interventionId: 1,
                    url: 'http://www.washingtonpost.com/wp-dyn/articles/A61981-2004Jun22.html',
                    website: 'washingtonpost.com',
                },
                {
                    interventionId: 1,
                    url: 'http://well.blogs.nytimes.com/2013/01/23/putting-a-number-to-smokings-toll/',
                    website: 'well.blogs.nytimes.com',
                },
                {
                    interventionId: 2,
                    url: 'http://www.ncbi.nlm.nih.gov/pubmed/22450936',
                    website: 'ncbi.nlm.nih.gov',
                },
                {
                    interventionId: 3,
                    url: 'http://www.newscientist.com/article/dn1928-seven-hours-sleep-the-safest.html',
                    website: 'newscientist.com',
                },
                {
                    interventionId: 4,
                    url: 'http://www.nlm.nih.gov/medlineplus/news/fullstory_87950.html',
                    website: 'nlm.nih.gov',
                },
                {
                    interventionId: 5,
                    url: 'http://www.medicalnewstoday.com/articles/98432.php',
                    website: 'medicalnewstoday.com',
                },
                {
                    interventionId: 5,
                    url: 'http://www.ncbi.nlm.nih.gov/pmc/articles/PMC1289326/',
                    website: 'ncbi.nlm.nih.gov',
                },
                {
                    interventionId: 6,
                    url: 'http://www.longevitypanel.co.uk/docs/life-expectancy-by-socio-economic-group.pdf',
                    website: 'longevitypanel.co.uk',
                },
                {
                    interventionId: 7,
                    url: 'http://www.amazon.com/Okinawa-Program-Longest-Lived-Everlasting-Health/dp/0609807501',
                    website: 'amazon.com',
                },
                {
                    interventionId: 7,
                    url: 'http://www.nanocorthx.com/Articles/HeartDiseaseStrokeStatistics.pdf',
                    website: 'nanocorthx.com',
                },
                {
                    interventionId: 8,
                    url: 'http://www.bbc.co.uk/news/magazine-17389938',
                    website: 'bbc.co.uk',
                },
                {
                    interventionId: 8,
                    url: 'http://archinte.jamanetwork.com/article.aspx?articleid=1134845',
                    website: 'archinte.jamanetwork.com',
                },
                {
                    interventionId: 9,
                    url: 'http://health.nytimes.com/health/guides/disease/alcoholism/possible-complications.html',
                    website: 'health.nytimes.com',
                },
                {
                    interventionId: 10,
                    url: 'http://aje.oxfordjournals.org/content/160/2/173.full',
                    website: 'aje.oxfordjournals.org',
                },
                {
                    interventionId: 10,
                    url: 'http://ririanproject.com/2007/03/30/cheat-death-and-grow-younger-with-these-44-longevity-tips/',
                    website: 'ririanproject.com',
                },
                {
                    interventionId: 11,
                    url: 'http://www.healio.com/psychiatry/journals/PsycAnn/%7B9D5D6D5E-31F4-4180-9BA8-4B71AE8D6617%7D/Mental-Health-Community-Case-Management-and-Its-Effect-on-Healthcare-Expenditures',
                    website: 'healio.com',
                },
                {
                    interventionId: 12,
                    url: 'http://www.nih.gov/news/pr/mar2005/nia-16.htm',
                    website: 'nih.gov',
                },
                {
                    interventionId: 12,
                    url: 'http://www.rti.org/newsroom/news.cfm?obj=3E553E11-5056-B172-B89D03CEB74687BF',
                    website: 'rti.org',
                },
                {
                    interventionId: 13,
                    url: 'http://www.ncbi.nlm.nih.gov/pubmed/17786799',
                    website: 'ncbi.nlm.nih.gov',
                },
                {
                    interventionId: 14,
                    url: 'http://www.medicalnewstoday.com/releases/21265.php',
                    website: 'medicalnewstoday.com',
                },
                {
                    interventionId: 14,
                    url: 'http://news.bbc.co.uk/1/hi/health/4347701.stm',
                    website: 'news.bbc.co.uk',
                },
                {
                    interventionId: 14,
                    url: 'http://www.ncbi.nlm.nih.gov/pmc/articles/PMC1733062/',
                    website: 'ncbi.nlm.nih.gov',
                },
                {
                    interventionId: 14,
                    url: 'http://www.ncbi.nlm.nih.gov/pmc/articles/PMC1733062/pdf/v059p00274.pdf',
                    website: 'ncbi.nlm.nih.gov',
                },
                {
                    interventionId: 14,
                    url: 'http://www.sciencedaily.com/releases/2011/03/110325151643.htm',
                    website: 'sciencedaily.com',
                },
                {
                    interventionId: 15,
                    url: 'http://www.psychpage.com/family/brwaitgalligher.html',
                    website: 'psychpage.com',
                },
                {
                    interventionId: 16,
                    url: 'http://www.newscientist.com/article/mg20327175.600-eating-less-may-be-the-key-to-living-longer.html',
                    website: 'newscientist.com',
                },
                {
                    interventionId: 16,
                    url: 'http://www.nytimes.com/2009/07/10/science/10aging.html?_r=2&hpw',
                    website: 'nytimes.com',
                },
                {
                    interventionId: 17,
                    url: 'http://sagecrossroads.net/webcast26',
                    website: 'sagecrossroads.net',
                },
                {
                    interventionId: 17,
                    url: 'http://sagecrossroads.net/files/transcript26Marmot.pdf',
                    website: 'sagecrossroads.net',
                },
                {
                    interventionId: 18,
                    url: 'http://www.cdc.gov/nchs/data/lifetables/life89_1_4.pdf',
                    website: 'cdc.gov',
                },
                {
                    interventionId: 19,
                    url: 'http://www.plosmedicine.org/article/info:doi/10.1371/journal.pmed.0050012',
                    website: 'plosmedicine.org',
                },
                {
                    interventionId: 20,
                    url: 'http://christakis.med.harvard.edu/pdf/media-talks/archive/ec_2010_08_11.pdf',
                    website: 'christakis.med.harvard.edu',
                },
                {
                    interventionId: 21,
                    url: 'http://www.cdc.gov/nchs/data/lifetables/life89_1_4.pdf',
                    website: 'cdc.gov',
                },
                {
                    interventionId: 22,
                    url: 'http://wtvr.com/2012/11/07/study-says-exercise-lengthens-life-even-if-youre-overweight/',
                    website: 'wtvr.com',
                },
                {
                    interventionId: 22,
                    url: 'http://www.wifle.org/pdf/Living_to_100.pdf',
                    website: 'wifle.org',
                },
                {
                    interventionId: 22,
                    url: 'http://www.plosmedicine.org/article/info%3Adoi%2F10.1371%2Fjournal.pmed.1001335;jsessionid=FCE9EBF47EDA37D706ECA89EC79653DD',
                    website: 'plosmedicine.org',
                },
                {
                    interventionId: 23,
                    url: 'http://www.guardian.co.uk/society/2009/apr/30/alcohol-life-expectancy-live-longer',
                    website: 'guardian.co.uk',
                },
                {
                    interventionId: 23,
                    url: 'http://en.wikipedia.org/wiki/Unit_of_alcohol',
                    website: 'en.wikipedia.org',
                },
                {
                    interventionId: 24,
                    url: 'http://www.ncbi.nlm.nih.gov/pubmed/18823176?ordinalpos=1&itool=EntrezSystem2.PEntrez.Pubmed.Pubmed_ResultsPanel.Pubmed_DiscoveryPanel.Pubmed_Discovery_RA&linkpos=4&log$=relatedreviews&logdbfrom=pubmed',
                    website: 'ncbi.nlm.nih.gov',
                },
                {
                    interventionId: 24,
                    url: 'http://www.nytimes.com/1993/11/09/news/the-secret-of-long-life-be-dour-and-dependable.html',
                    website: 'nytimes.com',
                },
                {
                    interventionId: 24,
                    url: 'http://www.psychosomaticmedicine.org/cgi/content/abstract/70/6/621',
                    website: 'psychosomaticmedicine.org',
                },
                {
                    interventionId: 25,
                    url: 'http://www.mensjournal.com/health-fitness/health/the-best-reason-to-have-sex-20121001',
                    website: 'mensjournal.com',
                },
                {
                    interventionId: 25,
                    url: 'http://www.medigraphic.com/pdfs/rma/cma-2004/cmas041c.pdf',
                    website: 'medigraphic.com',
                },
                {
                    interventionId: 26,
                    url: 'http://www.guardian.co.uk/society/2009/apr/30/alcohol-life-expectancy-live-longer',
                    website: 'guardian.co.uk',
                },
                {
                    interventionId: 26,
                    url: 'http://en.wikipedia.org/wiki/Unit_of_alcohol',
                    website: 'en.wikipedia.org',
                },
                {
                    interventionId: 27,
                    url: 'http://www.bmj.com/cgi/content/full/319/7215/953',
                    website: 'bmj.com',
                },
                {
                    interventionId: 27,
                    url: 'http://ije.oxfordjournals.org/cgi/content/abstract/35/4/969',
                    website: 'ije.oxfordjournals.org',
                },
                {
                    interventionId: 27,
                    url: 'http://ije.oxfordjournals.org/cgi/content/full/35/4/969',
                    website: 'ije.oxfordjournals.org',
                },
                {
                    interventionId: 27,
                    url: 'http://www.statistics.gov.uk/CCI/article.asp?ID=2076&Pos=2&ColRank=1&Rank=176',
                    website: 'statistics.gov.uk',
                },
                {
                    interventionId: 28,
                    url: 'http://www.cdc.gov/nchs/data/nvsr/nvsr57/nvsr57_14.pdf',
                    website: 'cdc.gov',
                },
                {
                    interventionId: 29,
                    url: 'http://www.guardian.co.uk/lifeandstyle/2010/jul/27/friendship-relationships-good-health-study',
                    website: 'guardian.co.uk',
                },
                {
                    interventionId: 29,
                    url: 'http://www.plosmedicine.org/article/info%3Adoi%2F10.1371%2Fjournal.pmed.1000316',
                    website: 'plosmedicine.org',
                },
                {
                    interventionId: 30,
                    url: 'http://www.sciencedaily.com/releases/1999/05/990517064323.htm',
                    website: 'sciencedaily.com',
                },
                {
                    interventionId: 30,
                    url: 'http://www.academia.edu/880932/Religious_involvement_and_US_adult_mortality',
                    website: 'academia.edu',
                },
                {
                    interventionId: 31,
                    url: 'http://aje.oxfordjournals.org/content/160/2/173.full',
                    website: 'aje.oxfordjournals.org',
                },
                {
                    interventionId: 31,
                    url: 'http://ririanproject.com/2007/03/30/cheat-death-and-grow-younger-with-these-44-longevity-tips/',
                    website: 'ririanproject.com',
                },
                {
                    interventionId: 32,
                    url: 'http://www.newscientist.com/article/dn14564-polygamy-is-the-key-to-a-long-life.html',
                    website: 'newscientist.com',
                },
                {
                    interventionId: 33,
                    url: 'http://news.harvard.edu/gazette/2001/09.20/08-longlife.html',
                    website: 'news.harvard.edu',
                },
                {
                    interventionId: 34,
                    url: 'https://bjsm.bmj.com/content/early/2019/02/26/bjsports-2018-099254',
                    website: 'bjsm.bmj.com',
                },
                {
                    interventionId: 35,
                    url: 'https://www.ishn.com/articles/111649-dog-ownership-associated-with-longer-life-especially-heart-attack-stroke-survivors',
                    website: 'ishn.com',
                },
            ],
            fields: [
                {
                    id: 'interventionId',
                    name: 'Intervention ID',
                    format: 'integerFormat',
                    description: 'The intervention this link supports. Not a quantity: never sum it.',
                },
                { id: 'website', name: 'Website', format: 'textFormat' },
                { id: 'url', name: 'Link', format: 'textFormat' },
            ],
        },
    ],
};
