-- Places Knowledge Base Schema
-- This creates a local database of hangout spots with details, reviews, geolocation, budgets, and tags

-- Main Places table
CREATE TABLE IF NOT EXISTS "Places" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "area" TEXT NOT NULL,  -- e.g., Bandra, Koramangala, Connaught Place
  "latitude" DECIMAL(10, 8),
  "longitude" DECIMAL(11, 8),
  "category" TEXT NOT NULL,  -- cafe, restaurant, park, movies, nightlife, mall, etc.
  "tags" TEXT[] DEFAULT '{}',  -- array of tags: romantic, family-friendly, budget, premium, outdoor, etc.
  "price_level" INTEGER CHECK (price_level >= 1 AND price_level <= 4),  -- 1=budget, 2=moderate, 3=expensive, 4=luxury
  "avg_cost_per_person" INTEGER,  -- in INR
  "rating" DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5),
  "total_reviews" INTEGER DEFAULT 0,
  "opening_hours" JSONB,  -- {"monday": "9:00-22:00", ...}
  "contact_phone" TEXT,
  "website" TEXT,
  "google_maps_link" TEXT,
  "images" TEXT[] DEFAULT '{}',
  "amenities" TEXT[] DEFAULT '{}',  -- wifi, parking, outdoor_seating, live_music, etc.
  "best_for" TEXT[] DEFAULT '{}',  -- dates, friends, family, solo, work
  "cuisine_type" TEXT[],  -- for restaurants/cafes
  "is_verified" BOOLEAN DEFAULT false,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Reviews table
CREATE TABLE IF NOT EXISTS "PlaceReviews" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "placeId" UUID NOT NULL REFERENCES "Places"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL,  -- Clerk user ID
  "userName" TEXT,
  "rating" INTEGER CHECK (rating >= 1 AND rating <= 5),
  "review_text" TEXT,
  "visit_date" DATE,
  "photos" TEXT[] DEFAULT '{}',
  "helpful_count" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Place Tags (for flexible tagging)
CREATE TABLE IF NOT EXISTS "PlaceTags" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE NOT NULL,
  "category" TEXT,  -- mood, activity, vibe, cuisine
  "icon" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS "idx_places_city" ON "Places"("city");
CREATE INDEX IF NOT EXISTS "idx_places_area" ON "Places"("area");
CREATE INDEX IF NOT EXISTS "idx_places_category" ON "Places"("category");
CREATE INDEX IF NOT EXISTS "idx_places_price_level" ON "Places"("price_level");
CREATE INDEX IF NOT EXISTS "idx_places_rating" ON "Places"("rating");
CREATE INDEX IF NOT EXISTS "idx_places_tags" ON "Places" USING GIN("tags");
CREATE INDEX IF NOT EXISTS "idx_places_location" ON "Places"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "idx_place_reviews_place" ON "PlaceReviews"("placeId");

-- Enable Row Level Security
ALTER TABLE "Places" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlaceReviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlaceTags" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can read places" ON "Places";
CREATE POLICY "Anyone can read places" ON "Places" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read reviews" ON "PlaceReviews";
CREATE POLICY "Anyone can read reviews" ON "PlaceReviews" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create reviews" ON "PlaceReviews";
CREATE POLICY "Users can create reviews" ON "PlaceReviews" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read tags" ON "PlaceTags";
CREATE POLICY "Anyone can read tags" ON "PlaceTags" FOR SELECT USING (true);

-- Seed some initial places (Mumbai, Delhi, Bangalore)
INSERT INTO "Places" ("name", "description", "address", "city", "area", "latitude", "longitude", "category", "tags", "price_level", "avg_cost_per_person", "rating", "total_reviews", "best_for", "amenities", "is_verified")
VALUES 
-- Mumbai
('Cafe Leopold', 'Iconic Mumbai cafe since 1871, known for its colonial charm and diverse menu', 'Colaba Causeway, Colaba', 'Mumbai', 'Colaba', 18.9220, 72.8312, 'cafe', ARRAY['iconic', 'tourist-friendly', 'historic', 'casual'], 2, 800, 4.2, 5420, ARRAY['friends', 'tourists', 'casual'], ARRAY['wifi', 'outdoor_seating'], true),
('Prithvi Theatre Cafe', 'Cozy cafe attached to the famous Prithvi Theatre, perfect for intellectuals', 'Juhu Church Road, Juhu', 'Mumbai', 'Juhu', 19.1075, 72.8263, 'cafe', ARRAY['artsy', 'quiet', 'intellectual', 'theater'], 1, 400, 4.5, 3200, ARRAY['dates', 'solo', 'friends'], ARRAY['outdoor_seating', 'cultural'], true),
('Social Khar', 'Trendy co-working cafe with great food and drinks', '16th Road, Khar West', 'Mumbai', 'Khar', 19.0726, 72.8360, 'cafe', ARRAY['trendy', 'work-friendly', 'nightlife', 'young'], 2, 700, 4.1, 4100, ARRAY['friends', 'work', 'dates'], ARRAY['wifi', 'coworking', 'bar'], true),
('Bademiya', 'Legendary late-night kebab spot since 1946', 'Tulloch Road, Apollo Bunder', 'Mumbai', 'Colaba', 18.9217, 72.8330, 'restaurant', ARRAY['street-food', 'late-night', 'iconic', 'budget'], 1, 300, 4.3, 8900, ARRAY['friends', 'late-night'], ARRAY['takeaway'], true),
('Marine Drive', 'Iconic seafront promenade, perfect for walks and sunsets', 'Marine Drive', 'Mumbai', 'Marine Drive', 18.9432, 72.8235, 'outdoor', ARRAY['romantic', 'scenic', 'free', 'iconic'], 1, 0, 4.7, 15000, ARRAY['dates', 'friends', 'family', 'solo'], ARRAY['free', 'scenic'], true),
('Phoenix Palladium', 'Premium mall with high-end shopping and dining', 'Senapati Bapat Marg, Lower Parel', 'Mumbai', 'Lower Parel', 19.0048, 72.8247, 'mall', ARRAY['premium', 'shopping', 'movies', 'dining'], 3, 1500, 4.4, 6700, ARRAY['friends', 'family', 'dates'], ARRAY['parking', 'movies', 'food_court'], true),

-- Delhi
('Cafe Lota', 'Beautiful cafe at National Crafts Museum with traditional Indian food', 'Bhairon Marg, Pragati Maidan', 'Delhi', 'Pragati Maidan', 28.6129, 77.2432, 'cafe', ARRAY['artsy', 'cultural', 'traditional', 'instagram'], 2, 600, 4.4, 4500, ARRAY['dates', 'friends', 'family'], ARRAY['outdoor_seating', 'cultural'], true),
('Hauz Khas Village', 'Bohemian neighborhood with cafes, bars, and historic ruins', 'Hauz Khas Village', 'Delhi', 'Hauz Khas', 28.5494, 77.2001, 'neighborhood', ARRAY['artsy', 'nightlife', 'historic', 'trendy'], 2, 800, 4.2, 8200, ARRAY['friends', 'dates', 'tourists'], ARRAY['bars', 'cafes', 'shopping'], true),
('Paranthe Wali Gali', 'Famous street in Old Delhi known for stuffed parathas', 'Chandni Chowk', 'Delhi', 'Chandni Chowk', 28.6562, 77.2301, 'street-food', ARRAY['street-food', 'iconic', 'budget', 'traditional'], 1, 200, 4.3, 7800, ARRAY['friends', 'family', 'tourists'], ARRAY['traditional'], true),
('India Gate', 'Iconic war memorial with beautiful lawns', 'Rajpath', 'Delhi', 'India Gate', 28.6129, 77.2295, 'outdoor', ARRAY['iconic', 'free', 'scenic', 'historic'], 1, 100, 4.6, 25000, ARRAY['family', 'friends', 'tourists'], ARRAY['free', 'ice_cream', 'boating'], true),
('Khan Market', 'Upscale market with cafes, bookstores, and boutiques', 'Khan Market', 'Delhi', 'Khan Market', 28.6005, 77.2274, 'market', ARRAY['upscale', 'cafes', 'shopping', 'books'], 3, 1000, 4.3, 5600, ARRAY['dates', 'friends', 'shopping'], ARRAY['cafes', 'bookstores', 'boutiques'], true),

-- Bangalore
('Third Wave Coffee', 'Popular specialty coffee chain with great ambiance', 'Indiranagar', 'Bangalore', 'Indiranagar', 12.9784, 77.6408, 'cafe', ARRAY['coffee', 'work-friendly', 'trendy', 'specialty'], 2, 400, 4.3, 3800, ARRAY['work', 'dates', 'solo'], ARRAY['wifi', 'specialty_coffee'], true),
('Cubbon Park', 'Historic green lung of Bangalore, perfect for morning walks', 'Kasturba Road', 'Bangalore', 'MG Road', 12.9763, 77.5929, 'park', ARRAY['free', 'nature', 'morning', 'peaceful'], 1, 0, 4.5, 12000, ARRAY['solo', 'dates', 'family', 'fitness'], ARRAY['free', 'jogging', 'nature'], true),
('Church Street Social', 'Trendy cafe-bar with great food and ambiance', 'Church Street', 'Bangalore', 'Church Street', 12.9735, 77.6066, 'cafe', ARRAY['trendy', 'nightlife', 'young', 'instagram'], 2, 700, 4.2, 5100, ARRAY['friends', 'dates'], ARRAY['wifi', 'bar', 'live_events'], true),
('VV Puram Food Street', 'Famous street food destination with South Indian delicacies', 'VV Puram', 'Bangalore', 'VV Puram', 12.9480, 77.5726, 'street-food', ARRAY['street-food', 'budget', 'local', 'vegetarian'], 1, 200, 4.4, 6700, ARRAY['friends', 'family', 'foodies'], ARRAY['vegetarian', 'local'], true),
('Lalbagh Botanical Garden', 'Historic garden with diverse flora and glass house', 'Lalbagh', 'Bangalore', 'Lalbagh', 12.9507, 77.5848, 'park', ARRAY['nature', 'historic', 'romantic', 'peaceful'], 1, 50, 4.6, 9800, ARRAY['dates', 'family', 'nature'], ARRAY['gardens', 'glass_house', 'lake'], true),
('UB City Mall', 'Luxury mall with premium brands and fine dining', 'Vittal Mallya Road', 'Bangalore', 'UB City', 12.9716, 77.5946, 'mall', ARRAY['luxury', 'premium', 'dining', 'shopping'], 4, 2500, 4.3, 4200, ARRAY['dates', 'premium'], ARRAY['parking', 'fine_dining', 'luxury_brands'], true),
('Toit Brewpub', 'Popular microbrewery with craft beers and good food', 'Indiranagar', 'Bangalore', 'Indiranagar', 12.9784, 77.6392, 'bar', ARRAY['craft-beer', 'nightlife', 'trendy', 'young'], 2, 1200, 4.4, 7800, ARRAY['friends', 'dates'], ARRAY['craft_beer', 'live_music', 'outdoor'], true)

ON CONFLICT DO NOTHING;

-- Seed initial tags
INSERT INTO "PlaceTags" ("name", "category")
VALUES 
('Cafe Hopping', 'activity'),
('Street Food', 'activity'),
('Fine Dining', 'activity'),
('Bowling/Arcade', 'activity'),
('Movie Night', 'activity'),
('Nature Walk', 'activity'),
('Shopping Spree', 'activity'),
('Clubbing/Bar', 'activity'),
('Museum/History', 'activity'),
('Adventure Sports', 'activity'),
('Spa/Relaxation', 'activity'),
('Workshop/Class', 'activity'),
('romantic', 'vibe'),
('casual', 'vibe'),
('trendy', 'vibe'),
('quiet', 'vibe'),
('lively', 'vibe'),
('budget', 'price'),
('moderate', 'price'),
('premium', 'price'),
('luxury', 'price')
ON CONFLICT DO NOTHING;
