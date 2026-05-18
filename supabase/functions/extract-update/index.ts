// ─────────────────────────────────────────────────────────────────
//  Edge Function: extract-update
//  Called from the OS submit modal when a builder writes/speaks
//  their weekly update. Sends raw text to Claude → returns a clean
//  structured object that fills the "Here's what I heard" review.
//
//  POST /functions/v1/extract-update
//  Headers: Authorization: Bearer <user-jwt>
//  Body: { raw_text: string, week: number }
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // ── Auth: verify the calling user ─────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? ''
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data: { user }, error: authErr } = await sb.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    // ── Parse body ────────────────────────────────────────────────
    const { raw_text, week } = await req.json()
    if (!raw_text?.trim()) {
      return new Response(JSON.stringify({ error: 'raw_text is required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    // Fetch builder name for the prompt context
    const { data: builder } = await sb
      .from('builders')
      .select('name, project_name, current_goal')
      .eq('id', user.id)
      .single()

    const builderName   = builder?.name         ?? 'Builder'
    const projectName   = builder?.project_name ?? ''
    const previousGoal  = builder?.current_goal ?? ''

    // ── Call Claude ───────────────────────────────────────────────
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5',
        max_tokens: 512,
        system: `You extract structured weekly progress data from a builder's raw update.
Return ONLY a valid JSON object with exactly these fields — no markdown, no extra text:

{
  "what_shipped": "1-2 sentences describing what they built, shipped, or accomplished",
  "metric": "their key number this week (e.g. '47 WAU', '$49 MRR', '340 subscribers', '3 user interviews'). Empty string if none mentioned.",
  "next_goal": "their stated goal or plan for next week. Empty string if not mentioned.",
  "honest_flag": true if they're openly admitting struggle, failure, or being behind — false otherwise,
  "needs_text": "if they're asking for help or an intro from the community, describe it in <10 words. Empty string if nothing needed."
}`,
        messages: [{
          role:    'user',
          content: `Builder: ${builderName}${projectName ? ' · ' + projectName : ''}
Week: ${week}
${previousGoal ? "Last week's goal: " + previousGoal : ""}

Their update:
${raw_text}`,
        }],
      }),
    })

    const claudeJson = await claudeRes.json()
    if (!claudeRes.ok) {
      console.error('Claude API error:', claudeJson)
      return new Response(JSON.stringify({ error: 'AI extraction failed' }), {
        status: 502, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    // Parse Claude's JSON response
    let extracted: Record<string, unknown>
    try {
      extracted = JSON.parse(claudeJson.content[0].text)
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 502, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    // ── Return to client ──────────────────────────────────────────
    return new Response(JSON.stringify(extracted), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('extract-update error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }
})
