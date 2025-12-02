# Hangout Planner - Implementation Report

## 1. System Overview
Hangout Planner is a collaborative web application designed to solve the "where should we go?" problem. It uses AI to find the optimal meeting point for a group of friends based on their individual locations, budgets, and mood preferences, and then generates curated itineraries.

## 2. Core Logic & Architecture

### A. The "Zero-Cost" Discovery Engine
One of the most significant innovations in this project is the move away from expensive paid APIs (Google Maps Places) to a smart, free alternative.

**The Workflow:**
1.  **Geocoding (OpenStreetMap)**:
    *   When a user enters "Mumbai" or "Bandra", we use the free Nominatim API to convert this text into Latitude/Longitude coordinates.
    *   *Why?* To mathematically calculate distances.

2.  **Meeting Point Calculation**:
    *   **Logic**: We calculate the "Centroid" (geometric center) of all member coordinates.
    *   *Benefit**: This ensures the meeting spot is geographically fair for everyone, minimizing total travel time for the group.

3.  **LLM-Based Web Scraping (The "Human" Approach)**:
    *   Instead of querying a database of places, the app mimics a human searching for recommendations.
    *   **Step 1**: It constructs a search query like *"Best Cafe Hopping places in Bandra West blog review"*.
    *   **Step 2**: It fetches the HTML of top search results (travel blogs, Top 10 lists).
    *   **Step 3**: It feeds this raw text into **Google Gemini**.
    *   **Step 4**: Gemini extracts structured data (Name, Rating, Address, Description) from the unstructured blog text.
    *   *Result*: We get high-quality, curated recommendations ("hidden gems") that locals love, rather than just whatever business paid to be on top of a map.

### B. AI Itinerary Curation
Once we have a list of real places, we don't just dump them on the user.
*   **Logic**: We use Gemini to generate a *narrative*.
*   **Input**: Real places found + Group Budget + Mood Tags.
*   **Output**: A structured JSON containing a story ("Start your evening at..."), an estimated cost, and a sequence of activities.

### C. Database Schema (Supabase)
The database is designed for data integrity and real-time performance.

*   **`Group` Table**: Stores the unique code and creator ID.
*   **`Member` Table**: Linked to Group. Stores individual preferences (Location, Budget, Mood Tags).
*   **`Itinerary` Table**: Stores the AI-generated plans for a group.
*   **`ItineraryVotes` Table**: Tracks which member voted for which itinerary.

## 3. Technical Stack
*   **Frontend**: Next.js 15 (App Router), React, Tailwind CSS.
*   **Backend**: Next.js API Routes (Serverless).
*   **Database**: Supabase (PostgreSQL).
*   **AI**: Google Gemini Pro.
*   **External Services**: OpenStreetMap (Geocoding), DuckDuckGo (Search).

## 4. Recent Improvements
*   **Robust Error Handling**: Added fallbacks. If scraping fails (e.g., network block), the AI falls back to its internal knowledge base to ensure the user always gets a result.
*   **Type Safety**: Full TypeScript implementation for all database and API interfaces.
*   **Performance**: Optimized build settings to fix timeout and file permission issues on Windows.
