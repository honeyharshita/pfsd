import React, { createContext, useContext, useState, useEffect } from 'react';

export const LANGUAGES = {
  en: { name: 'English', flag: '🇺🇸', dir: 'ltr', speech: 'en-US' },
  es: { name: 'Español', flag: '🇪🇸', dir: 'ltr', speech: 'es-ES' },
  fr: { name: 'Français', flag: '🇫🇷', dir: 'ltr', speech: 'fr-FR' },
  hi: { name: 'हिंदी', flag: '🇮🇳', dir: 'ltr', speech: 'hi-IN' },
  ar: { name: 'العربية', flag: '🇸🇦', dir: 'rtl', speech: 'ar-SA' },
  zh: { name: '中文', flag: '🇨🇳', dir: 'ltr', speech: 'zh-CN' },
  pt: { name: 'Português', flag: '🇧🇷', dir: 'ltr', speech: 'pt-BR' },
  de: { name: 'Deutsch', flag: '🇩🇪', dir: 'ltr', speech: 'de-DE' },
  ja: { name: '日本語', flag: '🇯🇵', dir: 'ltr', speech: 'ja-JP' },
  ko: { name: '한국어', flag: '🇰🇷', dir: 'ltr', speech: 'ko-KR' },
};

const T = {
  en: {
    appName: 'MindfulAI', tagline: 'Your Mind Deserves Peace',
    nav: { home:'Home', chat:'AI Chat', moodTracker:'Mood Tracker', dashboard:'Dashboard', moodForecast:'Mood Forecast', triggerAnalyzer:'Trigger Analyzer', weeklyReport:'Weekly Report', decisionHelper:'Decision Helper', games:'Games', journal:'Journal', meditation:'Meditation', habitBuilder:'Habit Builder', safeSpace:'Safe Space', emotionStory:'Emotion Story', photoMood:'Camera Mood', colorTherapy:'Color Therapy', studyHelp:'Study Help', positivityFeed:'Positivity Feed', resourceLibrary:'Resource Library', profile:'Profile', about:'About', admin:'Admin' },
    chat: { title:'MindfulAI Chat', subtitle:'Sentiment-Aware • Always here for you', placeholder:'Share what\'s on your mind...', summary:'Summary', listening:'Listening...', tapMic:'Tap to speak', camera:'Camera', send:'Send', welcome:'Hello! 💜 I\'m your MindfulAI companion. I\'m here to listen, understand, and support you. How are you feeling today?', freshStart:'Hello! 💜 Fresh start! How are you feeling right now?' },
    common: { darkMode:'Dark Mode', lightMode:'Light Mode', collapse:'Collapse', language:'Language', startChatting:'Start Chatting', moodForecast:'Mood Forecast', getStarted:'Get Started', trackMood:'Track Your Mood', analyze:'Analyze Mood', analyzing:'Analyzing...', takePhoto:'Take Photo', retake:'Retake', ok:'OK', cancel:'Cancel', main:'Main', aiFeatures:'AI Features', wellnessTools:'Wellness Tools', creative:'Creative', discover:'Discover' },
    photoMood: { title:'Camera Mood Analysis', subtitle:'Take a photo to let AI analyze your emotional state', capture:'Capture Photo', retake:'Retake', analyze:'Analyze Mood', tip:'Point the camera at yourself or anything that represents your mood' },
    home: { heroLine1:'Your Mind', heroLine2:'Deserves Peace', heroBadge:'AI-Powered Mental Wellness', heroSub:'20+ AI-powered features including mood forecasting, emotion trigger analysis, real-time camera mood detection, voice chat, and much more.', uniqueTitle:'Unique Features', uniqueSub:'You Won\'t Find Elsewhere', allFeaturesTitle:'Everything for Your', allFeaturesHighlight:'Well-being', cta:'Ready to Begin Your Journey?' },
    emotionStory: { title:'Emotion-Based Story Generator', subtitle:'Get a personalized motivational story based on how you feel', prompt:'How are you feeling right now?', generate:'Generate My Story', crafting:'Crafting your story...' },
    dashboard: { title:'Wellness Dashboard', subtitle:'Your mental health analytics at a glance', totalCheckins:'Total Check-ins', journalEntries:'Journal Entries', positiveRate:'Positive Rate', currentStreak:'Current Streak', moodDistribution:'Mood Distribution', weeklyMoodIntensity:'Weekly Mood Intensity', journalSentiment:'Journal Sentiment Over Time', emotionHeatmap:'Emotion Heatmap', noData:'No data yet', writeJournalPrompt:'Write journal entries to see sentiment trends' },
    moodTracker: { title:'Mood Tracker', subtitle:'Track and understand your emotional patterns', todayMood:"Today's Mood", howFeeling:'How are you feeling?', intensity:'Intensity', recentHistory:'Recent History', totalEntries:'Total Entries', mostCommon:'Most Common', thisWeek:'This Week', avgIntensity:'Avg Intensity', checkIn:'Check In', saveCheckIn:'Save Check-in', cancel:'Cancel', noEntries:'No mood entries yet. Start tracking!' },
    resourceLibrary: { title:'Emotional Support Library', subtitle:'Evidence-based resources for mental wellness', back:'Back to Library', searchPlaceholder:'Search articles, techniques, topics...', articles:'articles', read:'read' },
    about: { badge:'About MindfulAI', titleLine1:'Sentiment-Aware Conversational AI', titleLine2:'for Mental Wellness', subtitle:'MindfulAI is a comprehensive mental wellness platform that combines artificial intelligence, natural language processing, and interactive experiences to support your mental health journey.', featuresTitle:'Key Features', techTitle:'Technology Stack', architectureTitle:'System Architecture', readyTitle:'Ready to Start Your Wellness Journey?', cta:'Try MindfulAI Now' },
    aiInsights: { title:'AI Insights Hub', subtitle:'Comprehensive mental wellness assistance powered by AI', overview:'Overview', mood:'Mood', decision:'Decision Helper', emotions:'Emotions', wellness:'Wellness', learning:'Learning', welcome:'Welcome to AI Insights', intro:'This comprehensive hub includes 10 AI-powered features designed to support your mental wellness journey:', tip:'These AI features use advanced machine learning with local fallbacks to ensure reliable, private wellness assistance. All data is processed with your privacy in mind.' },
    colorTherapy: { title:'Mood-Based Color Therapy', subtitle:'Healing colors matched to your emotional state', howFeeling:'How are you feeling?', therapyColor:'Therapy Color', breathingVisualization:'Breathing Visualization', affirmation:'Affirmation', enterImmersive:'Enter Immersive Color Mode', exitImmersive:'Exit Color Therapy', discover:'Discover Therapeutic Color' },
    moodForecastPage: { title:'Mood Forecast', subtitle:'Predict mood trends over time', currentFeeling:'Current feeling', recalculate:'Recalculate Forecast', refresh:'Refresh Forecast', recommendations:'Recommendations', whyForecast:'Why this forecast', confidence:'Confidence', currentFeelingLabel:'Current feeling', recentHistory:'Recent history', mainDriver:'Main driver', tonightFactors:'Tonight\'s Factors', plannedSleepHours:'Planned Sleep Hours', currentStressLevel:'Current Stress Level', currentEnergyLevel:'Current Energy Level', analyzing:'Analyzing your patterns...', generateForecast:'Generate Tomorrow\'s Forecast', tomorrow:'Tomorrow', tipsForTomorrow:'Tips for Tomorrow', watchOutFor:'Watch Out For', notProvided:'Not provided', noRecentHistory:'No recent history yet', mixedInputs:'Mixed inputs', yourCurrentInput:'Your current input is the main driver of this forecast.' },
    studyHelp: { title:'Study Helper', prompt:'What do you want to study?', generate:'Generate Study Plan', recommendation:'Recommendation', sessionStyle:'Session Style', firstTask:'First Task', structuredSuggestions:'Structured Suggestions' },
    studySuggestions: { title:'Emotion-Based Study Suggestions', subtitle:'Study smarter based on how you feel right now', focusTimer:'Focus Timer Running', stopTimer:'Stop Timer', beforeStudy:'How are you feeling before studying?', subjectPlaceholder:'Subject (optional - e.g. Math, History, Programming)', gettingSuggestions:'Getting suggestions...', getPlan:'Get My Study Plan', sessionStructure:'Session Structure', start:'Start' },
    profile: {
      title: 'Profile',
      wellnessScore: 'Wellness Score',
      checkins: 'Check-ins',
      journalEntries: 'Journal Entries',
      badgesEarned: 'Badges Earned',
      moodGoals: 'Mood Goals',
      moodGoalsPlaceholder: 'What are your wellness goals? (e.g., "Practice mindfulness daily", "Reduce stress levels")',
      notifications: 'Notifications',
      dailyCheckin: 'Daily Mood Check-in',
      gratitudeReminder: 'Gratitude Challenge Reminder',
      meditationReminder: 'Meditation Reminder',
      saveSettings: 'Save Settings',
      achievements: 'Achievements',
      settingsSavedTitle: 'Settings saved',
      settingsSavedDesc: 'Your notification and wellness preferences were updated successfully.',
      saveFailedTitle: 'Save failed',
      saveFailedDesc: 'Unable to save settings right now. Please try again.'
    },
    notifications: {
      dailyCheckinTitle: 'Daily check-in reminder',
      dailyCheckinDesc: 'Take a quick mood check-in to keep your forecasts and reports accurate.',
      supportAlertTitle: 'Support alert',
      supportAlertDesc: 'Immediate support resources are available. Please review the crisis guidance.'
    },
  },
  es: {
    appName: 'MindfulAI', tagline: 'Tu Mente Merece Paz',
    nav: { home:'Inicio', chat:'Chat IA', moodTracker:'Seguimiento', dashboard:'Panel', moodForecast:'Pronóstico', triggerAnalyzer:'Desencadenantes', weeklyReport:'Reporte Semanal', decisionHelper:'Decisiones', games:'Juegos', journal:'Diario', meditation:'Meditación', habitBuilder:'Hábitos', safeSpace:'Espacio Seguro', emotionStory:'Historia', photoMood:'Cámara', colorTherapy:'Cromoterapia', studyHelp:'Estudio', positivityFeed:'Positividad', resourceLibrary:'Biblioteca', profile:'Perfil', about:'Acerca de', admin:'Admin' },
    chat: { title:'Chat MindfulAI', subtitle:'Con Sentimiento • Siempre aquí para ti', placeholder:'Comparte lo que tienes en mente...', summary:'Resumen', listening:'Escuchando...', tapMic:'Toca para hablar', camera:'Cámara', send:'Enviar', welcome:'Hello! 💜 I\'m your MindfulAI companion. I\'m here to listen, understand, and support you. How are you feeling today?', freshStart:'Hello! 💜 Fresh start! How are you feeling right now?' },
    common: { darkMode:'Modo Oscuro', lightMode:'Modo Claro', collapse:'Contraer', language:'Idioma', startChatting:'Empezar', moodForecast:'Pronóstico', getStarted:'Comenzar', trackMood:'Rastrear Humor', analyze:'Analizar', analyzing:'Analizando...', takePhoto:'Tomar Foto', retake:'Repetir', ok:'OK', cancel:'Cancelar', main:'Principal', aiFeatures:'IA', wellnessTools:'Bienestar', creative:'Creativo', discover:'Descubrir' },
    photoMood: { title:'Análisis por Cámara', subtitle:'Toma una foto para que la IA analice tu estado emocional', capture:'Capturar', retake:'Repetir', analyze:'Analizar', tip:'Apunta la cámara hacia ti o algo que represente tu humor' },
    home: { heroLine1:'Tu Mente', heroLine2:'Merece Paz', heroBadge:'Bienestar Mental con IA', heroSub:'20+ funciones con IA incluyendo predicción de humor, análisis de emociones, detección de humor por cámara, chat de voz y mucho más.', uniqueTitle:'Características Únicas', uniqueSub:'Que no encontrarás en otro lugar', allFeaturesTitle:'Todo para tu', allFeaturesHighlight:'Bienestar', cta:'¿Listo para comenzar tu viaje?' },
    emotionStory: { title:'Emotion-Based Story Generator', subtitle:'Get a personalized motivational story based on how you feel', prompt:'How are you feeling right now?', generate:'Generate My Story', crafting:'Crafting your story...' },
  },
  fr: {
    appName: 'MindfulAI', tagline: 'Votre Esprit Mérite la Paix',
    nav: { home:'Accueil', chat:'Chat IA', moodTracker:'Suivi', dashboard:'Tableau', moodForecast:'Prévision', triggerAnalyzer:'Déclencheurs', weeklyReport:'Rapport', decisionHelper:'Décisions', games:'Jeux', journal:'Journal', meditation:'Méditation', habitBuilder:'Habitudes', safeSpace:'Espace Sûr', emotionStory:'Histoire', photoMood:'Caméra', colorTherapy:'Chromothérapie', studyHelp:'Études', positivityFeed:'Positivité', resourceLibrary:'Bibliothèque', profile:'Profil', about:'À propos', admin:'Admin' },
    chat: { title:'Chat MindfulAI', subtitle:'Sensible aux Émotions • Toujours là', placeholder:'Partagez ce qui vous préoccupe...', summary:'Résumé', listening:'En écoute...', tapMic:'Appuyez pour parler', camera:'Caméra', send:'Envoyer', welcome:'Hello! 💜 I\'m your MindfulAI companion. I\'m here to listen, understand, and support you. How are you feeling today?', freshStart:'Hello! 💜 Fresh start! How are you feeling right now?' },
    common: { darkMode:'Mode Sombre', lightMode:'Mode Clair', collapse:'Réduire', language:'Langue', startChatting:'Commencer', moodForecast:'Prévision', getStarted:'Commencer', trackMood:'Suivre', analyze:'Analyser', analyzing:'Analyse...', takePhoto:'Prendre Photo', retake:'Reprendre', ok:'OK', cancel:'Annuler', main:'Principal', aiFeatures:'IA', wellnessTools:'Bien-être', creative:'Créatif', discover:'Découvrir' },
    photoMood: { title:'Analyse par Caméra', subtitle:'Prenez une photo pour que l\'IA analyse votre état émotionnel', capture:'Capturer', retake:'Reprendre', analyze:'Analyser', tip:'Pointez la caméra vers vous ou quelque chose qui représente votre humeur' },
    home: { heroLine1:'Votre Esprit', heroLine2:'Mérite la Paix', heroBadge:'Bien-être Mental avec IA', heroSub:'20+ fonctionnalités IA dont prévision d\'humeur, analyse des émotions, détection d\'humeur par caméra, chat vocal et plus.', uniqueTitle:'Fonctionnalités Uniques', uniqueSub:'Introuvables ailleurs', allFeaturesTitle:'Tout pour votre', allFeaturesHighlight:'Bien-être', cta:'Prêt à commencer votre voyage?' },
    emotionStory: { title:'Emotion-Based Story Generator', subtitle:'Get a personalized motivational story based on how you feel', prompt:'How are you feeling right now?', generate:'Generate My Story', crafting:'Crafting your story...' },
    dashboard: { title:'Wellness Dashboard', subtitle:'Your mental health analytics at a glance', totalCheckins:'Total Check-ins', journalEntries:'Journal Entries', positiveRate:'Positive Rate', currentStreak:'Current Streak', moodDistribution:'Mood Distribution', weeklyMoodIntensity:'Weekly Mood Intensity', journalSentiment:'Journal Sentiment Over Time', emotionHeatmap:'Emotion Heatmap', noData:'No data yet', writeJournalPrompt:'Write journal entries to see sentiment trends' },
    moodTracker: { title:'Mood Tracker', subtitle:'Track and understand your emotional patterns', todayMood:"Today's Mood", howFeeling:'How are you feeling?', intensity:'Intensity', recentHistory:'Recent History', totalEntries:'Total Entries', mostCommon:'Most Common', thisWeek:'This Week', avgIntensity:'Avg Intensity', checkIn:'Check In', saveCheckIn:'Save Check-in', cancel:'Cancel', noEntries:'No mood entries yet. Start tracking!' },
    resourceLibrary: { title:'Emotional Support Library', subtitle:'Evidence-based resources for mental wellness', back:'Back to Library', searchPlaceholder:'Search articles, techniques, topics...', articles:'articles', read:'read' },
    about: { badge:'About MindfulAI', titleLine1:'Sentiment-Aware Conversational AI', titleLine2:'for Mental Wellness', subtitle:'MindfulAI is a comprehensive mental wellness platform that combines artificial intelligence, natural language processing, and interactive experiences to support your mental health journey.', featuresTitle:'Key Features', techTitle:'Technology Stack', architectureTitle:'System Architecture', readyTitle:'Ready to Start Your Wellness Journey?', cta:'Try MindfulAI Now' },
    aiInsights: { title:'AI Insights Hub', subtitle:'Comprehensive mental wellness assistance powered by AI', overview:'Overview', mood:'Mood', decision:'Decision Helper', emotions:'Emotions', wellness:'Wellness', learning:'Learning', welcome:'Welcome to AI Insights', intro:'This comprehensive hub includes 10 AI-powered features designed to support your mental wellness journey:', tip:'These AI features use advanced machine learning with local fallbacks to ensure reliable, private wellness assistance. All data is processed with your privacy in mind.' },
    colorTherapy: { title:'Mood-Based Color Therapy', subtitle:'Healing colors matched to your emotional state', howFeeling:'How are you feeling?', therapyColor:'Therapy Color', breathingVisualization:'Breathing Visualization', affirmation:'Affirmation', enterImmersive:'Enter Immersive Color Mode', exitImmersive:'Exit Color Therapy', discover:'Discover Therapeutic Color' },
    moodForecastPage: { title:'Mood Forecast', subtitle:'Predict mood trends over time', currentFeeling:'Current feeling', recalculate:'Recalculate Forecast', refresh:'Refresh Forecast', recommendations:'Recommendations', whyForecast:'Why this forecast', confidence:'Confidence', currentFeelingLabel:'Current feeling', recentHistory:'Recent history', mainDriver:'Main driver', tonightFactors:'Tonight\'s Factors', plannedSleepHours:'Planned Sleep Hours', currentStressLevel:'Current Stress Level', currentEnergyLevel:'Current Energy Level', analyzing:'Analyzing your patterns...', generateForecast:'Generate Tomorrow\'s Forecast', tomorrow:'Tomorrow', tipsForTomorrow:'Tips for Tomorrow', watchOutFor:'Watch Out For', notProvided:'Not provided', noRecentHistory:'No recent history yet', mixedInputs:'Mixed inputs', yourCurrentInput:'Your current input is the main driver of this forecast.' },
    studyHelp: { title:'Study Helper', prompt:'What do you want to study?', generate:'Generate Study Plan', recommendation:'Recommendation', sessionStyle:'Session Style', firstTask:'First Task', structuredSuggestions:'Structured Suggestions' },
    studySuggestions: { title:'Emotion-Based Study Suggestions', subtitle:'Study smarter based on how you feel right now', focusTimer:'Focus Timer Running', stopTimer:'Stop Timer', beforeStudy:'How are you feeling before studying?', subjectPlaceholder:'Subject (optional - e.g. Math, History, Programming)', gettingSuggestions:'Getting suggestions...', getPlan:'Get My Study Plan', sessionStructure:'Session Structure', start:'Start' },
  },
  hi: {
    appName: 'MindfulAI', tagline: 'आपका मन शांति का हकदार है',
    nav: { home:'होम', chat:'AI चैट', moodTracker:'मूड ट्रैकर', dashboard:'डैशबोर्ड', moodForecast:'मूड पूर्वानुमान', triggerAnalyzer:'ट्रिगर', weeklyReport:'साप्ताहिक', decisionHelper:'निर्णय', games:'खेल', journal:'डायरी', meditation:'ध्यान', habitBuilder:'आदतें', safeSpace:'सुरक्षित', emotionStory:'कहानी', photoMood:'कैमरा', colorTherapy:'रंग चिकित्सा', studyHelp:'अध्ययन', positivityFeed:'सकारात्मकता', resourceLibrary:'पुस्तकालय', profile:'प्रोफ़ाइल', about:'बारे में', admin:'व्यवस्थापक' },
    chat: { title:'MindfulAI चैट', subtitle:'भावना-जागरूक • हमेशा आपके साथ', placeholder:'अपने मन की बात साझा करें...', summary:'सारांश', listening:'सुन रहा हूँ...', tapMic:'बोलने के लिए टैप करें', camera:'कैमरा', send:'भेजें' },
    common: { darkMode:'डार्क मोड', lightMode:'लाइट मोड', collapse:'संकुचित', language:'भाषा', startChatting:'चैट शुरू करें', moodForecast:'पूर्वानुमान', getStarted:'शुरू करें', trackMood:'ट्रैक करें', analyze:'विश्लेषण', analyzing:'विश्लेषण...', takePhoto:'फोटो लें', retake:'दोबारा लें', ok:'ठीक है', cancel:'रद्द करें', main:'मुख्य', aiFeatures:'AI फीचर', wellnessTools:'वेलनेस', creative:'रचनात्मक', discover:'खोजें' },
    photoMood: { title:'कैमरा मूड विश्लेषण', subtitle:'AI से मूड विश्लेषण के लिए फोटो लें', capture:'कैप्चर करें', retake:'दोबारा लें', analyze:'विश्लेषण करें', tip:'कैमरा अपनी तरफ या किसी ऐसी चीज़ की तरफ करें जो आपके मूड को दर्शाए' },
    home: { heroLine1:'आपका मन', heroLine2:'शांति का हकदार है', heroBadge:'AI-संचालित मानसिक स्वास्थ्य', heroSub:'20+ AI-संचालित फीचर्स जिनमें मूड पूर्वानुमान, भावना विश्लेषण, कैमरा मूड डिटेक्शन, वॉयस चैट और बहुत कुछ शामिल है।', uniqueTitle:'अनोखे फीचर्स', uniqueSub:'जो आपको कहीं और नहीं मिलेंगे', allFeaturesTitle:'आपकी', allFeaturesHighlight:'भलाई के लिए सब कुछ', cta:'अपनी यात्रा शुरू करने के लिए तैयार हैं?' },
  },
  ar: {
    appName: 'MindfulAI', tagline: 'عقلك يستحق السلام',
    nav: { home:'الرئيسية', chat:'محادثة', moodTracker:'تتبع المزاج', dashboard:'لوحة', moodForecast:'توقع المزاج', triggerAnalyzer:'المحفزات', weeklyReport:'تقرير', decisionHelper:'قرارات', games:'الألعاب', journal:'المذكرات', meditation:'تأمل', habitBuilder:'عادات', safeSpace:'مساحة آمنة', emotionStory:'قصة', photoMood:'كاميرا', colorTherapy:'ألوان', studyHelp:'دراسة', positivityFeed:'إيجابية', resourceLibrary:'مكتبة', profile:'الملف', about:'حول', admin:'المدير' },
    chat: { title:'محادثة MindfulAI', subtitle:'واعٍ بالمشاعر • دائمًا هنا من أجلك', placeholder:'شارك ما يدور في ذهنك...', summary:'ملخص', listening:'أستمع...', tapMic:'اضغط للتحدث', camera:'كاميرا', send:'إرسال' },
    common: { darkMode:'الوضع المظلم', lightMode:'الوضع المضيء', collapse:'طي', language:'اللغة', startChatting:'ابدأ المحادثة', moodForecast:'توقع المزاج', getStarted:'ابدأ', trackMood:'تتبع', analyze:'تحليل', analyzing:'جارٍ التحليل...', takePhoto:'التقط صورة', retake:'إعادة', ok:'موافق', cancel:'إلغاء', main:'رئيسي', aiFeatures:'الذكاء الاصطناعي', wellnessTools:'الصحة', creative:'الإبداع', discover:'اكتشف' },
    photoMood: { title:'تحليل المزاج بالكاميرا', subtitle:'التقط صورة ليحلل الذكاء الاصطناعي حالتك العاطفية', capture:'التقاط', retake:'إعادة', analyze:'تحليل', tip:'وجّه الكاميرا نحوك أو نحو شيء يعبر عن مزاجك' },
    home: { heroLine1:'عقلك', heroLine2:'يستحق السلام', heroBadge:'صحة نفسية بالذكاء الاصطناعي', heroSub:'أكثر من 20 ميزة بالذكاء الاصطناعي تشمل التنبؤ بالمزاج وتحليل العواطف واكتشاف المزاج بالكاميرا والدردشة الصوتية والمزيد.', uniqueTitle:'ميزات فريدة', uniqueSub:'لن تجدها في مكان آخر', allFeaturesTitle:'كل شيء من أجل', allFeaturesHighlight:'صحتك النفسية', cta:'هل أنت مستعد لبدء رحلتك؟' },
  },
  zh: {
    appName: 'MindfulAI', tagline: '您的心灵值得平静',
    nav: { home:'首页', chat:'AI聊天', moodTracker:'情绪追踪', dashboard:'仪表盘', moodForecast:'情绪预测', triggerAnalyzer:'触发分析', weeklyReport:'周报', decisionHelper:'决策助手', games:'游戏', journal:'日记', meditation:'冥想', habitBuilder:'习惯', safeSpace:'安全空间', emotionStory:'情感故事', photoMood:'相机', colorTherapy:'色彩疗法', studyHelp:'学习', positivityFeed:'积极动态', resourceLibrary:'资源库', profile:'个人资料', about:'关于', admin:'管理员' },
    chat: { title:'MindfulAI 聊天', subtitle:'情感感知 • 始终陪伴您', placeholder:'分享您的心声...', summary:'总结', listening:'正在聆听...', tapMic:'点击说话', camera:'相机', send:'发送' },
    common: { darkMode:'深色模式', lightMode:'浅色模式', collapse:'收起', language:'语言', startChatting:'开始聊天', moodForecast:'情绪预测', getStarted:'开始', trackMood:'追踪情绪', analyze:'分析情绪', analyzing:'分析中...', takePhoto:'拍照', retake:'重拍', ok:'确定', cancel:'取消', main:'主要', aiFeatures:'AI功能', wellnessTools:'健康工具', creative:'创意', discover:'探索' },
    photoMood: { title:'相机情绪分析', subtitle:'拍照让AI分析您的情绪状态', capture:'拍摄', retake:'重拍', analyze:'分析情绪', tip:'将相机对准自己或任何代表您心情的事物' },
    home: { heroLine1:'您的心灵', heroLine2:'值得平静', heroBadge:'AI驱动的心理健康平台', heroSub:'20多项AI功能，包括情绪预测、情绪触发分析、实时相机情绪检测、语音聊天等。', uniqueTitle:'独特功能', uniqueSub:'您在其他地方找不到的', allFeaturesTitle:'为您', allFeaturesHighlight:'健康所需的一切', cta:'准备好开始您的旅程了吗？' },
  },
  pt: {
    appName: 'MindfulAI', tagline: 'Sua Mente Merece Paz',
    nav: { home:'Início', chat:'Chat IA', moodTracker:'Humor', dashboard:'Painel', moodForecast:'Previsão', triggerAnalyzer:'Gatilhos', weeklyReport:'Relatório', decisionHelper:'Decisões', games:'Jogos', journal:'Diário', meditation:'Meditação', habitBuilder:'Hábitos', safeSpace:'Espaço Seguro', emotionStory:'História', photoMood:'Câmera', colorTherapy:'Cromoterapia', studyHelp:'Estudos', positivityFeed:'Positividade', resourceLibrary:'Biblioteca', profile:'Perfil', about:'Sobre', admin:'Admin' },
    chat: { title:'Chat MindfulAI', subtitle:'Consciente das Emoções • Sempre aqui', placeholder:'Compartilhe o que está na sua mente...', summary:'Resumo', listening:'Ouvindo...', tapMic:'Toque para falar', camera:'Câmera', send:'Enviar' },
    common: { darkMode:'Modo Escuro', lightMode:'Modo Claro', collapse:'Recolher', language:'Idioma', startChatting:'Começar', moodForecast:'Previsão', getStarted:'Começar', trackMood:'Rastrear', analyze:'Analisar', analyzing:'Analisando...', takePhoto:'Tirar Foto', retake:'Refazer', ok:'OK', cancel:'Cancelar', main:'Principal', aiFeatures:'IA', wellnessTools:'Bem-estar', creative:'Criativo', discover:'Descobrir' },
    photoMood: { title:'Análise por Câmera', subtitle:'Tire uma foto para a IA analisar seu estado emocional', capture:'Capturar', retake:'Refazer', analyze:'Analisar', tip:'Aponte a câmera para você ou algo que represente seu humor' },
    home: { heroLine1:'Sua Mente', heroLine2:'Merece Paz', heroBadge:'Saúde Mental com IA', heroSub:'20+ recursos com IA incluindo previsão de humor, análise de gatilhos, detecção de humor por câmera, chat de voz e muito mais.', uniqueTitle:'Recursos Únicos', uniqueSub:'Que você não encontrará em outro lugar', allFeaturesTitle:'Tudo para o seu', allFeaturesHighlight:'Bem-estar', cta:'Pronto para começar sua jornada?' },
  },
  de: {
    appName: 'MindfulAI', tagline: 'Dein Geist verdient Frieden',
    nav: { home:'Start', chat:'KI-Chat', moodTracker:'Stimmung', dashboard:'Dashboard', moodForecast:'Vorhersage', triggerAnalyzer:'Auslöser', weeklyReport:'Wochenbericht', decisionHelper:'Entscheidung', games:'Spiele', journal:'Tagebuch', meditation:'Meditation', habitBuilder:'Gewohnheiten', safeSpace:'Sicherer Raum', emotionStory:'Geschichte', photoMood:'Kamera', colorTherapy:'Farbtherapie', studyHelp:'Lernen', positivityFeed:'Positivität', resourceLibrary:'Bibliothek', profile:'Profil', about:'Über', admin:'Admin' },
    chat: { title:'MindfulAI Chat', subtitle:'Stimmungsbewusst • Immer für dich da', placeholder:'Teile mit, was dir auf dem Herzen liegt...', summary:'Zusammenfassung', listening:'Höre zu...', tapMic:'Tippen zum Sprechen', camera:'Kamera', send:'Senden' },
    common: { darkMode:'Dunkelmodus', lightMode:'Hellmodus', collapse:'Einklappen', language:'Sprache', startChatting:'Chat starten', moodForecast:'Vorhersage', getStarted:'Loslegen', trackMood:'Verfolgen', analyze:'Analysieren', analyzing:'Analysiere...', takePhoto:'Foto aufnehmen', retake:'Erneut', ok:'OK', cancel:'Abbrechen', main:'Haupt', aiFeatures:'KI', wellnessTools:'Wellness', creative:'Kreativ', discover:'Entdecken' },
    photoMood: { title:'Kamera-Stimmungsanalyse', subtitle:'Machen Sie ein Foto, damit die KI Ihren emotionalen Zustand analysiert', capture:'Aufnehmen', retake:'Erneut', analyze:'Analysieren', tip:'Richten Sie die Kamera auf sich oder etwas, das Ihre Stimmung darstellt' },
    home: { heroLine1:'Dein Geist', heroLine2:'verdient Frieden', heroBadge:'KI-gestützte mentale Gesundheit', heroSub:'20+ KI-Funktionen inklusive Stimmungsvorhersage, Emotionsanalyse, Kamera-Stimmungserkennung, Sprachmemos und mehr.', uniqueTitle:'Einzigartige Funktionen', uniqueSub:'Die du nirgendwo sonst findest', allFeaturesTitle:'Alles für dein', allFeaturesHighlight:'Wohlbefinden', cta:'Bereit, deine Reise zu beginnen?' },
  },
  ja: {
    appName: 'MindfulAI', tagline: 'あなたの心は平和に値する',
    nav: { home:'ホーム', chat:'AIチャット', moodTracker:'気分追跡', dashboard:'ダッシュボード', moodForecast:'気分予測', triggerAnalyzer:'トリガー分析', weeklyReport:'週報', decisionHelper:'意思決定', games:'ゲーム', journal:'日記', meditation:'瞑想', habitBuilder:'習慣', safeSpace:'安全な場所', emotionStory:'感情の物語', photoMood:'カメラ', colorTherapy:'色彩療法', studyHelp:'学習', positivityFeed:'ポジティブ', resourceLibrary:'ライブラリ', profile:'プロフィール', about:'概要', admin:'管理者' },
    chat: { title:'MindfulAI チャット', subtitle:'感情認識 • 常にそばに', placeholder:'心の中のことを共有してください...', summary:'要約', listening:'聴いています...', tapMic:'話すにはタップ', camera:'カメラ', send:'送信' },
    common: { darkMode:'ダークモード', lightMode:'ライトモード', collapse:'折りたたむ', language:'言語', startChatting:'チャット開始', moodForecast:'気分予測', getStarted:'始める', trackMood:'追跡', analyze:'分析', analyzing:'分析中...', takePhoto:'写真を撮る', retake:'撮り直す', ok:'OK', cancel:'キャンセル', main:'メイン', aiFeatures:'AI機能', wellnessTools:'ウェルネス', creative:'クリエイティブ', discover:'発見' },
    photoMood: { title:'カメラ気分分析', subtitle:'写真を撮ってAIに感情状態を分析させましょう', capture:'撮影', retake:'撮り直す', analyze:'分析', tip:'自分やあなたの気持ちを表すものにカメラを向けてください' },
    home: { heroLine1:'あなたの心は', heroLine2:'平和に値する', heroBadge:'AI搭載のメンタルウェルネス', heroSub:'気分予測、感情トリガー分析、リアルタイムカメラ気分検出、音声チャットなど20以上のAI機能。', uniqueTitle:'ユニークな機能', uniqueSub:'他では見つけられない', allFeaturesTitle:'あなたの', allFeaturesHighlight:'ウェルビーイングのすべて', cta:'あなたの旅を始める準備はできていますか？' },
  },
  ko: {
    appName: 'MindfulAI', tagline: '당신의 마음은 평화를 받을 자격이 있어요',
    nav: { home:'홈', chat:'AI 채팅', moodTracker:'기분 추적', dashboard:'대시보드', moodForecast:'기분 예측', triggerAnalyzer:'트리거 분석', weeklyReport:'주간 보고', decisionHelper:'결정 도우미', games:'게임', journal:'일기', meditation:'명상', habitBuilder:'습관', safeSpace:'안전한 공간', emotionStory:'감정 이야기', photoMood:'카메라', colorTherapy:'색채 치료', studyHelp:'학습', positivityFeed:'긍정 피드', resourceLibrary:'라이브러리', profile:'프로필', about:'소개', admin:'관리자' },
    chat: { title:'MindfulAI 채팅', subtitle:'감정 인식 • 항상 곁에', placeholder:'마음속 이야기를 나눠주세요...', summary:'요약', listening:'듣고 있어요...', tapMic:'말하려면 탭하세요', camera:'카메라', send:'전송' },
    common: { darkMode:'다크 모드', lightMode:'라이트 모드', collapse:'접기', language:'언어', startChatting:'채팅 시작', moodForecast:'기분 예측', getStarted:'시작하기', trackMood:'추적하기', analyze:'분석', analyzing:'분석 중...', takePhoto:'사진 찍기', retake:'다시 찍기', ok:'확인', cancel:'취소', main:'메인', aiFeatures:'AI 기능', wellnessTools:'웰니스', creative:'창의', discover:'탐색' },
    photoMood: { title:'카메라 기분 분석', subtitle:'AI가 감정 상태를 분석할 수 있도록 사진을 찍어주세요', capture:'촬영', retake:'다시 찍기', analyze:'분석', tip:'자신이나 기분을 나타내는 것에 카메라를 향해주세요' },
    home: { heroLine1:'당신의 마음은', heroLine2:'평화를 받을 자격이 있어요', heroBadge:'AI 기반 정신 건강 플랫폼', heroSub:'기분 예측, 감정 트리거 분석, 실시간 카메라 기분 감지, 음성 채팅 등 20개 이상의 AI 기능.', uniqueTitle:'독특한 기능', uniqueSub:'다른 곳에서는 찾을 수 없는', allFeaturesTitle:'당신의', allFeaturesHighlight:'웰빙을 위한 모든 것', cta:'당신의 여정을 시작할 준비가 되셨나요?' },
  },
};

const LanguageContext = createContext({ language: 'en', setLanguage: () => {}, t: (k) => k, dir: 'ltr' });

export function LanguageProvider({ children }) {
  const [language, setLangState] = useState(() => localStorage.getItem('mindful_lang') || 'en');

  const setLanguage = (lang) => {
    localStorage.setItem('mindful_lang', lang);
    setLangState(lang);
    document.documentElement.dir = LANGUAGES[lang]?.dir || 'ltr';
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.dir = LANGUAGES[language]?.dir || 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'mindful_lang' && event.newValue && event.newValue !== language) {
        setLangState(event.newValue);
        document.documentElement.dir = LANGUAGES[event.newValue]?.dir || 'ltr';
        document.documentElement.lang = event.newValue;
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [language]);

  const t = (path) => {
    const keys = path.split('.');
    let val = T[language];
    for (const k of keys) { val = val?.[k]; }
    if (!val) { val = T.en; for (const k of keys) { val = val?.[k]; } }
    return val || path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir: LANGUAGES[language]?.dir || 'ltr' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() { return useContext(LanguageContext); }
export default LanguageContext;