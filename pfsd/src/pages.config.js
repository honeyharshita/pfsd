/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import ColorTherapy from './pages/ColorTherapy';
import ResourceLibrary from './pages/ResourceLibrary';
import About from './pages/About';
import Games from './pages/Games';
import Meditation from './pages/Meditation';
import Chat from './pages/Chat';
import EmotionStory from './pages/EmotionStory';
import WeeklyReport from './pages/WeeklyReport';
import HabitBuilder from './pages/HabitBuilder';
import Profile from './pages/Profile';
import MoodForecast from './pages/MoodForecast';
import SafeSpace from './pages/SafeSpace';
import EmotionTrigger from './pages/EmotionTrigger';
import StudySuggestions from './pages/StudySuggestions';
import PositivityFeed from './pages/PositivityFeed';
import DecisionHelper from './pages/DecisionHelper';
import Home from './pages/Home';
import Journal from './pages/Journal';
import MoodPhotoUpload from './pages/MoodPhotoUpload';
import MoodTracker from './pages/MoodTracker';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ColorTherapy": ColorTherapy,
    "ResourceLibrary": ResourceLibrary,
    "About": About,
    "Games": Games,
    "Meditation": Meditation,
    "Chat": Chat,
    "EmotionStory": EmotionStory,
    "WeeklyReport": WeeklyReport,
    "HabitBuilder": HabitBuilder,
    "Profile": Profile,
    "MoodForecast": MoodForecast,
    "SafeSpace": SafeSpace,
    "EmotionTrigger": EmotionTrigger,
    "StudySuggestions": StudySuggestions,
    "PositivityFeed": PositivityFeed,
    "DecisionHelper": DecisionHelper,
    "Home": Home,
    "Journal": Journal,
    "MoodPhotoUpload": MoodPhotoUpload,
    "MoodTracker": MoodTracker,
    "Admin": Admin,
    "Dashboard": Dashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};