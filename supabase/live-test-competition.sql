-- Live Test Competition Tables
-- Enables learners to compete with each other in scheduled live tests

-- Table for scheduled live test sessions
CREATE TABLE IF NOT EXISTS live_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    test_number INTEGER NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(batch_id, test_number, scheduled_at)
);

-- Table for participants in live tests
CREATE TABLE IF NOT EXISTS live_test_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    live_test_id UUID NOT NULL REFERENCES live_tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'joined', 'in_progress', 'completed', 'absent')),
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    score INTEGER,
    correct_answers INTEGER,
    wrong_answers INTEGER,
    time_taken_seconds INTEGER,
    UNIQUE(live_test_id, user_id)
);

-- Enable RLS
ALTER TABLE live_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_test_participants ENABLE ROW LEVEL SECURITY;

-- Policies for live_tests
CREATE POLICY "Live tests viewable by batch purchasers"
ON live_tests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM purchases 
        WHERE batch_id = live_tests.batch_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Live tests creatable by any purchaser"
ON live_tests FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM purchases 
        WHERE batch_id = live_tests.batch_id 
        AND user_id = auth.uid()
    )
);

-- Policies for live_test_participants
CREATE POLICY "Participants viewable by test participants"
ON live_test_participants FOR SELECT
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM live_tests lt
        WHERE lt.id = live_test_participants.live_test_id
        AND EXISTS (
            SELECT 1 FROM purchases 
            WHERE batch_id = lt.batch_id 
            AND user_id = auth.uid()
        )
    )
);

CREATE POLICY "Participants insertable by self"
ON live_test_participants FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Participants updatable by self"
ON live_test_participants FOR UPDATE
USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_live_tests_batch_id ON live_tests(batch_id);
CREATE INDEX idx_live_tests_status ON live_tests(status);
CREATE INDEX idx_live_tests_scheduled_at ON live_tests(scheduled_at);
CREATE INDEX idx_live_test_participants_live_test_id ON live_test_participants(live_test_id);
CREATE INDEX idx_live_test_participants_user_id ON live_test_participants(user_id);
