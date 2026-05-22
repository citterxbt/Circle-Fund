-- Circle Fund Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROPOSALS TABLE
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    one_line_summary VARCHAR(140) NOT NULL,
    category TEXT NOT NULL,
    project_url TEXT,
    twitter_url TEXT,
    github_url TEXT,
    description TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    proposed_solution TEXT NOT NULL,
    technical_architecture TEXT,
    team_members JSONB NOT NULL DEFAULT '[]'::jsonb,
    previous_work TEXT,
    relevant_experience TEXT NOT NULL,
    requested_amount NUMERIC NOT NULL,
    budget_breakdown TEXT NOT NULL,
    budget_justification TEXT NOT NULL,
    timeline TEXT NOT NULL,
    risk_mitigation TEXT NOT NULL,
    expected_impact TEXT NOT NULL,
    success_metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
    long_term_vision TEXT,
    agree_to_terms BOOLEAN NOT NULL DEFAULT false,
    documents JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    author_wallet TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MILESTONES TABLE
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    metrics TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, report_submitted, approved, rejected, claimed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MILESTONE REPORTS TABLE
CREATE TABLE milestone_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VOTES TABLE
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    voter_wallet TEXT NOT NULL,
    vote_type TEXT NOT NULL, -- upvote, downvote
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(proposal_id, voter_wallet)
);

-- COMMENTS TABLE
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    author_wallet TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES (Simulate Claimed Amount)
CREATE TABLE profiles (
    wallet_address TEXT PRIMARY KEY,
    username VARCHAR(12),
    bio TEXT,
    avatar_url TEXT,
    twitter_url TEXT,
    telegram_url TEXT,
    github_url TEXT,
    total_claimed NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Functions for JWT Claims
CREATE OR REPLACE FUNCTION public.get_jwt_wallet()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'wallet_address', '')::text;
$$;

CREATE OR REPLACE FUNCTION public.is_jwt_admin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE((current_setting('request.jwt.claims', true)::json->>'admin')::boolean, false);
$$;

-- Enable RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Proposals
CREATE POLICY "Public read proposals" ON proposals FOR SELECT USING (true);
CREATE POLICY "Wallet owners insert proposals" ON proposals FOR INSERT TO authenticated 
  WITH CHECK (LOWER(author_wallet) = LOWER(public.get_jwt_wallet()));
CREATE POLICY "Admin update proposals" ON proposals FOR UPDATE TO authenticated
  USING (public.is_jwt_admin() = true);

-- Milestones
CREATE POLICY "Public read milestones" ON milestones FOR SELECT USING (true);
CREATE POLICY "Wallet owners insert milestones" ON milestones FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM proposals WHERE id = proposal_id AND status = 'pending' AND LOWER(author_wallet) = LOWER(public.get_jwt_wallet()))
  );
CREATE POLICY "Admin update milestones" ON milestones FOR UPDATE TO authenticated
  USING (LOWER(public.get_jwt_wallet()) = (SELECT LOWER(author_wallet) FROM proposals WHERE id = proposal_id) OR public.is_jwt_admin() = true);

-- Milestone Reports
CREATE POLICY "Public read milestone_reports" ON milestone_reports FOR SELECT USING (true);
CREATE POLICY "Wallet owners insert reports" ON milestone_reports FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM milestones m
      JOIN proposals p ON m.proposal_id = p.id
      WHERE m.id = milestone_id AND m.status = 'pending' AND LOWER(p.author_wallet) = LOWER(public.get_jwt_wallet())
    )
  );
CREATE POLICY "Admin update reports" ON milestone_reports FOR UPDATE TO authenticated
  USING (public.is_jwt_admin() = true);

-- Votes
CREATE POLICY "Public read votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Wallet owners own votes" ON votes FOR ALL TO authenticated
  USING (LOWER(voter_wallet) = LOWER(public.get_jwt_wallet()))
  WITH CHECK (LOWER(voter_wallet) = LOWER(public.get_jwt_wallet()) AND EXISTS(SELECT 1 FROM proposals WHERE id = proposal_id AND status = 'pending'));

-- Comments
CREATE POLICY "Public read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Wallet owners insert comments" ON comments FOR INSERT TO authenticated
  WITH CHECK (LOWER(author_wallet) = LOWER(public.get_jwt_wallet()));

-- Profiles (Claim simulation & user data)
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Wallet owners insert profiles" ON profiles FOR INSERT TO authenticated
  WITH CHECK (LOWER(wallet_address) = LOWER(public.get_jwt_wallet()));
CREATE POLICY "Wallet owners update profiles" ON profiles FOR UPDATE TO authenticated
  USING (LOWER(wallet_address) = LOWER(public.get_jwt_wallet()));

-- Security Triggers

-- Prevent users from inserting pre-approved or claimed entities
CREATE OR REPLACE FUNCTION secure_insert_defaults() RETURNS trigger AS $$
BEGIN
  IF NOT public.is_jwt_admin() THEN
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER force_proposal_pending 
BEFORE INSERT ON proposals 
FOR EACH ROW EXECUTE FUNCTION secure_insert_defaults();

CREATE TRIGGER force_milestone_pending 
BEFORE INSERT ON milestones 
FOR EACH ROW EXECUTE FUNCTION secure_insert_defaults();

CREATE TRIGGER force_report_pending 
BEFORE INSERT ON milestone_reports 
FOR EACH ROW EXECUTE FUNCTION secure_insert_defaults();

-- Prevent users from updating fields arbitrarily or skipping milestone statuses
CREATE OR REPLACE FUNCTION secure_milestone_update() RETURNS trigger AS $$
BEGIN
  -- Admins can update anything freely
  IF public.is_jwt_admin() THEN
    RETURN NEW;
  END IF;

  -- Ensure the user is the author
  IF LOWER(public.get_jwt_wallet()) != (SELECT LOWER(author_wallet) FROM proposals WHERE id = OLD.proposal_id) THEN
    RAISE EXCEPTION 'Not authorized to update this milestone';
  END IF;

  -- Prevent structural manipulation
  IF NEW.id != OLD.id OR NEW.proposal_id != OLD.proposal_id OR NEW.title != OLD.title OR NEW.amount != OLD.amount OR NEW.deadline != OLD.deadline THEN
    RAISE EXCEPTION 'Cannot modify milestone structural details';
  END IF;

  -- Enforce strictly allowed status transitions for users
  IF NEW.status != OLD.status THEN
    IF NOT (
      (OLD.status IN ('pending', 'rejected') AND NEW.status = 'report_submitted') OR
      (OLD.status = 'approved' AND NEW.status = 'claimed')
    ) THEN
      RAISE EXCEPTION 'Invalid milestone status transition for non-admin user';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_milestone_update
BEFORE UPDATE ON milestones
FOR EACH ROW EXECUTE FUNCTION secure_milestone_update();

-- Auto-update profile claimed amounts on milestone claim atomically
CREATE OR REPLACE FUNCTION handle_milestone_claim() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'claimed' AND OLD.status = 'approved' THEN
    UPDATE profiles 
    SET total_claimed = total_claimed + NEW.amount 
    WHERE LOWER(wallet_address) = LOWER((SELECT author_wallet FROM proposals WHERE id = NEW.proposal_id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_milestone_claim_update_profile
AFTER UPDATE ON milestones
FOR EACH ROW EXECUTE FUNCTION handle_milestone_claim();

-- Storage for Avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
CREATE POLICY "Wallet owners can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'avatars' );
CREATE POLICY "Wallet owners can update avatars" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'avatars' );

-- Prevent users from tampering with critical profile fields
CREATE OR REPLACE FUNCTION secure_profile_update() RETURNS trigger AS $$
BEGIN
  IF NOT public.is_jwt_admin() THEN
    IF NEW.wallet_address != OLD.wallet_address THEN
      RAISE EXCEPTION 'Cannot modify wallet address';
    END IF;
    IF NEW.total_claimed != OLD.total_claimed THEN
      RAISE EXCEPTION 'Cannot manually modify total claimed amount';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_profile_update
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION secure_profile_update();
