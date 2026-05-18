// src/screens/PrashnScreen.js — প্রশ্নকুণ্ডলী
import React from 'react';
import WebViewScreen from '../components/WebViewScreen';

export default function PrashnScreen() {
  return (
    <WebViewScreen
      uri="https://www.myastrology.in/prashna.html"
      extraHideJS={`
        var el = document.getElementById('how-it-works');
        if (el) el.style.display='none';
      `}
    />
  );
}
