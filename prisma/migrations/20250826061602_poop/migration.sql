-- CreateTable
CREATE TABLE "public"."Group" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL,
    "moodTags" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ItineraryVotes" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "itineraryIdx" INTEGER NOT NULL,

    CONSTRAINT "ItineraryVotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Group_code_key" ON "public"."Group"("code");

-- CreateIndex
CREATE INDEX "Group_code_idx" ON "public"."Group"("code");

-- CreateIndex
CREATE INDEX "Member_groupId_idx" ON "public"."Member"("groupId");

-- CreateIndex
CREATE INDEX "ItineraryVotes_groupId_idx" ON "public"."ItineraryVotes"("groupId");

-- CreateIndex
CREATE INDEX "ItineraryVotes_memberId_idx" ON "public"."ItineraryVotes"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryVotes_groupId_memberId_key" ON "public"."ItineraryVotes"("groupId", "memberId");

-- AddForeignKey
ALTER TABLE "public"."Member" ADD CONSTRAINT "Member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItineraryVotes" ADD CONSTRAINT "ItineraryVotes_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItineraryVotes" ADD CONSTRAINT "ItineraryVotes_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
