// ─────────────────────────────────────────────────────────────────
//  Edge Function: generate-digest
//  Runs every Sunday night at 11:45pm ET via Supabase cron.
//  Reads all weekly_updates for the current week → calls Claude →
//  writes the AI digest to cohort_digests.
//
//  Can also be triggered manually:
//  POST /functions/v1/generate-digest
//  Headers: Authorization: Bearer <service-role-key>
//  Body: { week: number, cohort?: string }
// ─────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY    = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // ── Auth: service role only ───────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    if (token !== SUPABASE_SERVICE_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // ── Determine week ────────────────────────────────────────────
    let { week, cohort } = req.method === 'POST'
      ? await req.json().catch(() => ({}))
      : {}

    cohort = cohort ?? '2026'

    // If week not provided, auto-calculate from camp start
    if (!week) {
      const CAMP_START   = new Date('2026-08-01T00:00:00-04:00')
      const MS_PER_WEEK  = 7 * 24 * 60 * 60 * 1000
      week = Math.floor((Date.now() - CAMP_START.getTime()) / MS_PER_WEEK) + 1
      week = Math.max(1, Math.min(5, week))
    }

    console.log(`Generating digest for week ${week}, cohort ${cohort}`)

    // ── Fetch all updates for the week ────────────────────────────
    const { data: updates, error: fetchErr } = await sb
      .from('weekly_updates')
      .select('*, builders(name, project_name)')
      .eq('week', week)
      .order('submitted_at', { ascending: true })

    if (fetchErr) throw fetchErr
    if (!updates || updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No updates found for this week' }), {
        status: 404, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${updates.length} updates`)

    // ── Build the prompt ──────────────────────────────────────────
    const updateBlocks = updates.map((u: Record<string, any>) => {
      const b = u.builders ?? {}
      return [
        `BUILDER: ${b.name ?? 'Unknown'}${b.project_name ? ' · ' + b.project_name : ''}`,
        `What shipped: ${u.what_shipped || '(not specified)'}`,
        `Metric: ${u.metric || '(not specified)'}`,
        `Next goal: ${u.next_goal || '(not specified)'}`,
        u.honest_flag ? `⚑ HONEST UPDATE — admitted struggle` : '',
        u.needs_text  ? `⚑ NEEDS: ${u.needs_text}` : '',
      ].filter(Boolean).join('\n')
    }).join('\n\n---\n\n')

    // ── Call Claude ───────────────────────────────────────────────
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        max_tokens: 1500,
        system: `You are the AI editor for Summer Camp, a 5-week program where builders ship their first AI product. Every Sunday night you synthesize the cohort's weekly updates into a digest.

Return ONLY valid JSON — no markdown, no extra text — with this exact shape:

{
  "synthesis": "One vivid 1–2 sentence pull quote capturing the honest energy of the week. Written in present tense. Not corporate. Should feel like something a good editor would write on deadline.",

  "momentum": [
    { "name": "Builder Name", "detail": "Specific metric + what drove it. Keep it punchy." }
  ],

  "honest": [
    { "name": "Builder Name", "detail": "Quote or paraphrase their most honest moment. Why it matters." }
  ],

  "needs": [
    { "name": "Builder Name", "detail": "What they need + a specific call to action for the cohort." }
  ],

  "breakout": [
    { "name": "Builder Name", "detail": "Why their trajectory is worth watching. Specific, not hype." }
  ]
}

Rules:
- momentum: top 2–3 builders with the most measurable progress this week
- honest: 1 builder whose candor was most valuable (could be about struggle OR insight)
- needs: all builders who flagged they need something
- breakout: 1 builder whose week-over-week arc is most compelling
- Every entry must use real names and real specifics from the updates
- Keep each "detail" under 25 words
- If a section has no valid entries (e.g. nobody flagged needs), return an empty array []`,

        messages: [{
          role:    'user',
          content: `Week ${week} updates from ${updates.length} builders:\n\n${updateBlocks}`,
        }],
      }),
    })

    const claudeJson = await claudeRes.json()
    if (!claudeRes.ok) {
      console.error('Claude error:', claudeJson)
      throw new Error('Claude API call failed')
    }

    // ── Parse Claude's response ───────────────────────────────────
    let digest: Record<string, unknown>
    try {
      digest = JSON.parse(claudeJson.content[0].text)
    } catch {
      console.error('Failed to parse Claude response:', claudeJson.content[0].text)
      throw new Error('Failed to parse AI digest')
    }

    // ── Save to cohort_digests ────────────────────────────────────
    const { error: upsertErr } = await sb
      .from('cohort_digests')
      .upsert({
        cohort,
        week,
        synthesis:      digest.synthesis      ?? '',
        momentum_json:  digest.momentum       ?? [],
        honest_json:    digest.honest         ?? [],
        needs_json:     digest.needs          ?? [],
        breakout_json:  digest.breakout       ?? [],
        generated_at:   new Date().toISOString(),
      }, { onConflict: 'cohort,week' })

    if (upsertErr) throw upsertErr

    console.log(`Digest saved for week ${week}`)
    return new Response(JSON.stringify({
      ok:      true,
      week,
      cohort,
      builders: updates.length,
      synthesis: digest.synthesis,
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('generate-digest error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }
})
