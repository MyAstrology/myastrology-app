// src/config.js — centralized URLs and app constants

const BASE = 'https://www.myastrology.in';

export const API = {
  rashifal:    (date) => `${BASE}/rashifal/${date}.json`,
  blog:        `${BASE}/src/content/blog/list.json`,
  blogPost:    (slug) => `${BASE}/blog/${slug}.html`,
};

export const PAGES = {
  kundali:     `${BASE}/kundali.html`,
  matchMaking: `${BASE}/match-making.html`,
  varshaphala: `${BASE}/varshaphala.html`,
  gochar:      `${BASE}/kundali.html`,
  prashna:     `${BASE}/prashna.html`,
  vastu:       `${BASE}/vastu-science.html`,
  palmistry:   `${BASE}/palmistry.html`,
  vedicAstro:  `${BASE}/astrology.html`,
  gemstone:    `${BASE}/gemstone.html`,
  numerology:  `${BASE}/numerology.html`,
  panjika:     `${BASE}/panjika.html`,
  rashifal:    `${BASE}/rashifal.html`,
};

export const CONTACT = {
  whatsapp:    'https://wa.me/919333122768',
  phone:       '+919333122768',
  mapsUrl:     'https://maps.google.com/?q=23.1676,88.5809',
};

export const YOUTUBE = {
  channelId:   'UCUbNv_CazFQRSMkRH_iBPOQ',
  channelUrl:  'https://www.youtube.com/@myastrology',
  rssUrl:      'https://www.youtube.com/feeds/videos.xml?channel_id=UCUbNv_CazFQRSMkRH_iBPOQ',
  rss2JsonApi: 'https://api.rss2json.com/v1/api.json?rss_url=',
  sitemapUrl:  `${BASE}/video-sitemap.xml`,
  thumbUrl:    (id) => `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
};

export const APP = {
  version:     '1.0.0',
  name:        'MyAstrology',
  author:      'Dr. Produyut Acharya',
  website:     BASE,
  privacyUrl:  `${BASE}/privacy-policy.html`,
  termsUrl:    `${BASE}/terms-of-service.html`,
};
