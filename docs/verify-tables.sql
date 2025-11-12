-- Verify Investment Manager Tables Exist
-- Run this in Supabase SQL Editor to check if tables were created

-- Check if tables exist
SELECT
    tablename as table_name,
    schemaname as schema
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'structures',
    'investors',
    'structure_investors',
    'investments',
    'capital_calls',
    'capital_call_allocations',
    'distributions',
    'distribution_allocations',
    'waterfall_tiers',
    'documents'
)
ORDER BY tablename;

-- Count rows in each table (if they exist)
DO $$
BEGIN
    RAISE NOTICE '=== TABLE ROW COUNTS ===';

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'structures') THEN
        RAISE NOTICE 'structures: %', (SELECT COUNT(*) FROM structures);
    ELSE
        RAISE NOTICE 'structures: TABLE NOT FOUND';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'investors') THEN
        RAISE NOTICE 'investors: %', (SELECT COUNT(*) FROM investors);
    ELSE
        RAISE NOTICE 'investors: TABLE NOT FOUND';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'investments') THEN
        RAISE NOTICE 'investments: %', (SELECT COUNT(*) FROM investments);
    ELSE
        RAISE NOTICE 'investments: TABLE NOT FOUND';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'capital_calls') THEN
        RAISE NOTICE 'capital_calls: %', (SELECT COUNT(*) FROM capital_calls);
    ELSE
        RAISE NOTICE 'capital_calls: TABLE NOT FOUND';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'distributions') THEN
        RAISE NOTICE 'distributions: %', (SELECT COUNT(*) FROM distributions);
    ELSE
        RAISE NOTICE 'distributions: TABLE NOT FOUND';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'waterfall_tiers') THEN
        RAISE NOTICE 'waterfall_tiers: %', (SELECT COUNT(*) FROM waterfall_tiers);
    ELSE
        RAISE NOTICE 'waterfall_tiers: TABLE NOT FOUND';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
        RAISE NOTICE 'documents: %', (SELECT COUNT(*) FROM documents);
    ELSE
        RAISE NOTICE 'documents: TABLE NOT FOUND';
    END IF;
END $$;
