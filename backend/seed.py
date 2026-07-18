from datetime import datetime, date
from sqlalchemy.orm import Session
from models import Participant, Meeting, TranscriptSegment, Topic, Summary, ActionItem

def seed_database(db: Session) -> None:
    # Check if we already have meetings
    if db.query(Meeting).first() is not None:
        print("Database already seeded. Skipping.")
        return

    print("Starting database seeding...")

    # 1. Create Participants
    participants_data = [
        {"name": "Sarah Chen", "email": "sarah.chen@company.com", "color": "#4A90D9", "role": "PM"},
        {"name": "Alex Rivera", "email": "alex.rivera@company.com", "color": "#7A5AF8", "role": "Senior Dev"},
        {"name": "Jordan Park", "email": "jordan.park@company.com", "color": "#E74C3C", "role": "Frontend Dev"},
        {"name": "Maya Patel", "email": "maya.patel@company.com", "color": "#2ECC71", "role": "Designer"},
        {"name": "David Kim", "email": "david.kim@company.com", "color": "#F39C12", "role": "Account Executive"},
        {"name": "Rachel Torres", "email": "rachel.torres@acmecorp.com", "color": "#9B59B6", "role": "VP of Ops at Acme"},
        {"name": "Lisa Wang", "email": "lisa.wang@company.com", "color": "#1ABC9C", "role": "Engineering Manager"},
        {"name": "Tom Bradley", "email": "tom.bradley@company.com", "color": "#E67E22", "role": "Senior Engineer"},
        {"name": "Priya Sharma", "email": "priya.sharma@company.com", "color": "#3498DB", "role": "UX Researcher"},
        {"name": "Chris Evans", "email": "chris.evans@external.com", "color": "#95A5A6", "role": "Beta User"},
    ]

    participants_map = {}
    for pd in participants_data:
        p = Participant(name=pd["name"], email=pd["email"], avatar_color=pd["color"])
        db.add(p)
        participants_map[pd["name"]] = p

    db.flush() # Flush to get generated IDs from SQLite

    # Helper function to create segments evenly spaced
    def create_segments(meeting, dialogue_list, duration):
        segments = []
        count = len(dialogue_list)
        step = duration / max(count, 1)
        for i, (speaker_name, text) in enumerate(dialogue_list):
            start = int(i * step)
            end = int(start + step * 0.9)
            if end >= duration:
                end = duration - 1
            segment = TranscriptSegment(
                meeting=meeting,
                speaker=participants_map[speaker_name],
                start_time_seconds=start,
                end_time_seconds=end,
                text=text,
                order_index=i
            )
            segments.append(segment)
        return segments

    # --- Meeting 1: Sprint Planning ---
    m1 = Meeting(
        title="Sprint Planning — Q3 Feature Priorities",
        date=datetime.fromisoformat("2024-01-15T10:00:00"),
        duration_seconds=2700
    )
    m1.participants.extend([participants_map["Sarah Chen"], participants_map["Alex Rivera"], participants_map["Jordan Park"], participants_map["Maya Patel"]])
    db.add(m1)
    db.flush()

    db.add(Summary(meeting_id=m1.id, overview_text="The team conducted a sprint planning session focused on Q3 feature priorities. Key decisions included prioritizing the dashboard redesign and API performance improvements. The team estimated 47 story points for the sprint with a focus on reducing technical debt. Sarah will coordinate with stakeholders on timeline adjustments, while Alex leads the backend optimization effort. Maya presented updated mockups that received positive feedback, and Jordan flagged some frontend performance concerns that need addressing before the next release."))

    db.add_all([
        Topic(meeting_id=m1.id, title="Sprint Goals & Priorities", start_time_seconds=0),
        Topic(meeting_id=m1.id, title="Feature Discussion & Requirements", start_time_seconds=540),
        Topic(meeting_id=m1.id, title="Estimation & Capacity Planning", start_time_seconds=1620),
        Topic(meeting_id=m1.id, title="Action Items & Wrap-up", start_time_seconds=2340),
    ])

    db.add_all([
        ActionItem(meeting_id=m1.id, text="Finalize dashboard redesign mockups and share with stakeholders", assignee_id=participants_map["Maya Patel"].id, is_completed=True, due_date=date.fromisoformat("2024-01-19")),
        ActionItem(meeting_id=m1.id, text="Set up performance benchmarking for API endpoints", assignee_id=participants_map["Alex Rivera"].id, is_completed=False, due_date=date.fromisoformat("2024-01-22")),
        ActionItem(meeting_id=m1.id, text="Create Jira tickets for Q3 sprint backlog items", assignee_id=participants_map["Sarah Chen"].id, is_completed=True, due_date=date.fromisoformat("2024-01-17")),
        ActionItem(meeting_id=m1.id, text="Investigate and document frontend bundle size optimization options", assignee_id=participants_map["Jordan Park"].id, is_completed=False, due_date=date.fromisoformat("2024-01-24")),
        ActionItem(meeting_id=m1.id, text="Schedule follow-up meeting with design team for component library review", assignee_id=participants_map["Sarah Chen"].id, is_completed=False, due_date=date.fromisoformat("2024-01-26")),
    ])

    m1_dialogue = [
        ("Sarah Chen", "Alright everyone, let's get started. We've got a packed agenda today — I want to walk through the Q3 priorities and make sure we're all aligned on what's going into this sprint."),
        ("Sarah Chen", "The big push this quarter is the dashboard redesign and improving overall platform stability."),
        ("Maya Patel", "I have the latest mockups ready for the dashboard. We've simplified the top navigation and added the new widget system."),
        ("Sarah Chen", "Thanks Maya, they look fantastic. Before we dive into the design specifics, I want to talk about technical debt."),
        ("Alex Rivera", "Yeah, I'm glad you brought that up. We've been accumulating technical debt in the notification service, and I think we need to allocate at least a couple of days this sprint to address it."),
        ("Alex Rivera", "The database queries there are starting to slow down the whole API during peak hours."),
        ("Jordan Park", "Speaking of performance, I wanted to flag something on the frontend. The new dashboard mockups are great, but our bundle size is creeping up."),
        ("Jordan Park", "If we add all these new charting libraries, we're going to see a noticeable impact on initial load times."),
        ("Sarah Chen", "Okay, those are both valid points. Let's make sure we have dedicated capacity for tech debt. How much effort are we talking about for the API optimization?"),
        ("Alex Rivera", "I'd estimate about 8 story points. I need to set up some benchmarking first to know exactly what's failing, then rewrite a couple of the heavier joins."),
        ("Sarah Chen", "Alright, let's get that in. Jordan, can you investigate the bundle size issue and see if we can lazy-load some of those charting libraries?"),
        ("Jordan Park", "Sure, I can create a ticket for that and do a spike. Probably 3 points."),
        ("Maya Patel", "For the design implementation, I've broken the dashboard down into 5 main components. Should we try to tackle them all this sprint?"),
        ("Sarah Chen", "Let's review our capacity. Alex, what's our total point budget for this sprint?"),
        ("Alex Rivera", "With Tom and Lisa helping out, we're looking at around 47 points total available."),
        ("Sarah Chen", "Got it. If we do the API optimization and the frontend spike, that leaves us with about 36 points for the dashboard."),
        ("Maya Patel", "That should be enough to get the core navigation and the first three widgets done."),
        ("Sarah Chen", "Perfect. Let's start estimating those specific stories. First up, the new side navigation menu."),
        ("Jordan Park", "I'd say that's a 5. We need to handle mobile responsiveness too."),
        ("Alex Rivera", "Agreed. What about the recent activity widget?"),
        ("Jordan Park", "That depends on if the backend endpoint is ready. Alex?"),
        ("Alex Rivera", "I can have the endpoint ready by Wednesday. Let's call the frontend work a 5 and the backend a 3."),
        ("Sarah Chen", "Okay, so we're looking good on capacity. Any major blockers anyone foresees?"),
        ("Maya Patel", "Just need to finalize these mockups with the wider stakeholder group, but I don't expect major pushback."),
        ("Sarah Chen", "Great. Let's wrap up. I'll coordinate with the stakeholders. Maya, you finalize the mockups. Alex and Jordan, you've got your performance tasks. Let's have a great sprint!")
    ]
    db.add_all(create_segments(m1, m1_dialogue, m1.duration_seconds))

    # --- Meeting 2: Sales Discovery ---
    m2 = Meeting(
        title="Sales Discovery Call — Acme Corp",
        date=datetime.fromisoformat("2024-01-16T14:00:00"),
        duration_seconds=1800
    )
    m2.participants.extend([participants_map["David Kim"], participants_map["Rachel Torres"]])
    db.add(m2)
    db.flush()

    db.add(Summary(meeting_id=m2.id, overview_text="Discovery call with Rachel Torres, VP of Operations at Acme Corp. Acme currently manages 200+ meetings per week across 15 departments using a combination of manual note-taking and basic recording tools. Key pain points include inconsistent meeting documentation, difficulty searching past discussions, and lack of action item tracking. Rachel expressed strong interest in our automated transcription and AI summary features. The company has a budget allocated for Q2 tool adoption and is evaluating three vendors. Follow-up demo scheduled for next week."))

    db.add_all([
        Topic(meeting_id=m2.id, title="Introduction & Company Overview", start_time_seconds=0),
        Topic(meeting_id=m2.id, title="Current Pain Points & Workflow", start_time_seconds=420),
        Topic(meeting_id=m2.id, title="Solution Fit & Feature Discussion", start_time_seconds=1080),
    ])

    db.add_all([
        ActionItem(meeting_id=m2.id, text="Send Acme Corp customized proposal with enterprise pricing", assignee_id=participants_map["David Kim"].id, is_completed=False, due_date=date.fromisoformat("2024-01-19")),
        ActionItem(meeting_id=m2.id, text="Schedule product demo with Acme technical team", assignee_id=participants_map["David Kim"].id, is_completed=True, due_date=date.fromisoformat("2024-01-18")),
        ActionItem(meeting_id=m2.id, text="Share case studies from similar-sized organizations", assignee_id=participants_map["David Kim"].id, is_completed=False, due_date=date.fromisoformat("2024-01-19")),
        ActionItem(meeting_id=m2.id, text="Prepare ROI analysis based on 200+ weekly meetings", assignee_id=participants_map["David Kim"].id, is_completed=False, due_date=date.fromisoformat("2024-01-22")),
    ])

    m2_dialogue = [
        ("David Kim", "Hi Rachel, thanks so much for taking the time to speak with me today. How's your week going?"),
        ("Rachel Torres", "It's going well, thanks David. Very busy, but that's par for the course."),
        ("David Kim", "I can imagine! I'd love to start by giving a quick 30-second overview of what we do, and then I really want to hear more about Acme Corp's current processes."),
        ("David Kim", "Essentially, we provide an AI-powered meeting assistant that automatically transcribes, summarizes, and extracts action items from your calls."),
        ("Rachel Torres", "That sounds exactly like what we're looking for. Right now, our meeting management is, frankly, a bit of a mess."),
        ("David Kim", "Could you tell me a bit more about what that looks like today? How many meetings are we talking about?"),
        ("Rachel Torres", "We're running upwards of 200 meetings a week across 15 different departments. It's a lot to keep track of."),
        ("Rachel Torres", "Currently, we rely on someone taking manual notes, and we use basic Zoom recordings, but nobody ever goes back and watches a 45-minute recording."),
        ("David Kim", "That's a very common challenge. When people don't go back to the notes or recordings, what's the business impact you're seeing?"),
        ("Rachel Torres", "The biggest issue is inconsistent documentation. Decisions get made, but a week later, people have different recollections of what was agreed upon."),
        ("Rachel Torres", "Also, action items fall through the cracks constantly. There's no centralized way to track who is supposed to do what after a call."),
        ("David Kim", "I hear you. That loss of accountability can really slow down projects. If you could wave a magic wand, what would the ideal solution look like?"),
        ("Rachel Torres", "I want a system where the notes are just generated automatically, instantly searchable, and action items are clearly assigned and tracked."),
        ("David Kim", "Let me tell you how we address that. Our platform integrates directly with your calendar. The bot joins the call, and within minutes of it ending, everyone gets a highly accurate summary."),
        ("David Kim", "Furthermore, our AI specifically identifies action items and who they were assigned to, and can even push those to tools like Jira or Asana."),
        ("Rachel Torres", "The integration with Jira would be huge for our engineering team. Do you support enterprise-level access controls?"),
        ("David Kim", "Absolutely. We have full RBAC, SSO integration, and SOC2 compliance. We work with companies much larger than Acme in highly regulated industries."),
        ("Rachel Torres", "That's reassuring. We do have a budget allocated for Q2 to solve this problem, but we are evaluating a couple of other vendors as well."),
        ("David Kim", "Understood. I'd love to set up a deeper technical demo next week with your team to show you exactly how this looks in practice. How does your Tuesday look?"),
        ("Rachel Torres", "Tuesday afternoon works. Send over a calendar invite, and if you could include some case studies and pricing, that would be helpful.")
    ]
    db.add_all(create_segments(m2, m2_dialogue, m2.duration_seconds))

    # --- Meeting 3: 1:1 Check-in ---
    m3 = Meeting(
        title="1:1 — Engineering Manager Check-in",
        date=datetime.fromisoformat("2024-01-17T11:00:00"),
        duration_seconds=1500
    )
    m3.participants.extend([participants_map["Lisa Wang"], participants_map["Tom Bradley"]])
    db.add(m3)
    db.flush()

    db.add(Summary(meeting_id=m3.id, overview_text="Bi-weekly 1:1 between Lisa Wang and Tom Bradley. Tom reported good progress on the authentication service migration, with 70% of endpoints converted to the new OAuth2 flow. Key blocker is the staging environment setup, which depends on the infrastructure team. Discussed Tom's interest in the tech lead track — Lisa suggested leading the upcoming API gateway project as a growth opportunity. Tom mentioned feeling stretched thin with on-call rotations and Lisa agreed to redistribute the schedule. Overall positive meeting with clear action items for both parties."))

    db.add_all([
        Topic(meeting_id=m3.id, title="Project Updates & Progress", start_time_seconds=0),
        Topic(meeting_id=m3.id, title="Career Development & Growth", start_time_seconds=480),
        Topic(meeting_id=m3.id, title="Blockers & Support Needed", start_time_seconds=960),
    ])

    db.add_all([
        ActionItem(meeting_id=m3.id, text="Follow up with infrastructure team on staging environment timeline", assignee_id=participants_map["Lisa Wang"].id, is_completed=False, due_date=date.fromisoformat("2024-01-19")),
        ActionItem(meeting_id=m3.id, text="Draft tech lead development plan with milestones", assignee_id=participants_map["Tom Bradley"].id, is_completed=False, due_date=date.fromisoformat("2024-01-24")),
        ActionItem(meeting_id=m3.id, text="Redistribute on-call rotation schedule for Q1", assignee_id=participants_map["Lisa Wang"].id, is_completed=True, due_date=date.fromisoformat("2024-01-22")),
    ])

    m3_dialogue = [
        ("Lisa Wang", "Hey Tom, good to see you. How have things been going since our last 1:1?"),
        ("Tom Bradley", "Hey Lisa. Things have been good, pretty busy. The auth service migration is my main focus right now."),
        ("Lisa Wang", "Awesome. How is the progress looking on that? Are we still on track for the end of the month?"),
        ("Tom Bradley", "Yeah, I've got about 70% of the endpoints converted to the new OAuth2 flow. The core logic is solid."),
        ("Lisa Wang", "That's great progress. Are there any hurdles or anything slowing you down?"),
        ("Tom Bradley", "The main blocker right now is the staging environment. I'm waiting on the infrastructure team to provision the new testing databases."),
        ("Lisa Wang", "Okay, I'll follow up with infra today and see if we can expedite that. I know they've been swamped too."),
        ("Tom Bradley", "Thanks, that would really help. I'm kind of bottlenecked until I can properly test the full flow."),
        ("Lisa Wang", "I wanted to shift gears a bit and talk about your career goals. Last time we chatted, you mentioned being interested in the tech lead path."),
        ("Tom Bradley", "Yes, definitely. I really enjoy mentoring the newer devs and thinking about the higher-level architecture."),
        ("Lisa Wang", "I think you'd be a great fit for that track. We have the new API gateway project coming up next quarter."),
        ("Lisa Wang", "I was thinking that could be a great opportunity for you to step up and lead the technical design on a new initiative."),
        ("Tom Bradley", "Wow, yes, I'd love to take that on. That sounds like exactly the kind of challenge I'm looking for."),
        ("Lisa Wang", "Great. Why don't you draft up a rough development plan with some milestones you want to hit to get ready for that role?"),
        ("Tom Bradley", "Will do. One other thing I wanted to bring up... I've been feeling a bit stretched thin lately, especially with the on-call rotations."),
        ("Tom Bradley", "It seems like I've been the primary responder a lot more often this month."),
        ("Lisa Wang", "I completely understand. With the recent team changes, the schedule did get a bit lopsided. I'll take an action item to redistribute the on-call schedule for Q1 so it's more balanced."),
        ("Tom Bradley", "I appreciate that, Lisa. It'll definitely help me focus more on the auth migration and this new tech lead goal.")
    ]
    db.add_all(create_segments(m3, m3_dialogue, m3.duration_seconds))

    # --- Meeting 4: User Research Interview ---
    m4 = Meeting(
        title="User Research Interview — Dashboard Redesign",
        date=datetime.fromisoformat("2024-01-18T15:00:00"),
        duration_seconds=2100
    )
    m4.participants.extend([participants_map["Priya Sharma"], participants_map["Maya Patel"], participants_map["Chris Evans"]])
    db.add(m4)
    db.flush()

    db.add(Summary(meeting_id=m4.id, overview_text="User research interview with Chris Evans, a beta user, to gather feedback on the dashboard redesign. Chris highlighted that he spends approximately 2 hours daily navigating between different dashboard views and expressed frustration with the current search functionality. Key findings: users want a unified view combining meeting summaries, action items, and upcoming meetings. The proposed card-based layout received positive feedback, though Chris suggested adding keyboard shortcuts for power users. Maya's prototype of the new filtering system was well-received, particularly the date range picker and participant filter. Priority features identified: global search, quick-access recent meetings, and customizable dashboard widgets."))

    db.add_all([
        Topic(meeting_id=m4.id, title="Research Introduction & Context", start_time_seconds=0),
        Topic(meeting_id=m4.id, title="Current Workflow & Pain Points", start_time_seconds=360),
        Topic(meeting_id=m4.id, title="Prototype Review & Feedback", start_time_seconds=1020),
        Topic(meeting_id=m4.id, title="Feature Prioritization & Next Steps", start_time_seconds=1680),
    ])

    db.add_all([
        ActionItem(meeting_id=m4.id, text="Compile user research findings into report", assignee_id=participants_map["Priya Sharma"].id, is_completed=False, due_date=date.fromisoformat("2024-01-22")),
        ActionItem(meeting_id=m4.id, text="Update dashboard prototype based on Chris feedback", assignee_id=participants_map["Maya Patel"].id, is_completed=False, due_date=date.fromisoformat("2024-01-25")),
        ActionItem(meeting_id=m4.id, text="Design keyboard shortcut system for power users", assignee_id=participants_map["Maya Patel"].id, is_completed=False, due_date=date.fromisoformat("2024-01-29")),
        ActionItem(meeting_id=m4.id, text="Schedule 3 additional user interviews for validation", assignee_id=participants_map["Priya Sharma"].id, is_completed=True, due_date=date.fromisoformat("2024-01-22")),
    ])

    m4_dialogue = [
        ("Priya Sharma", "Hi Chris, thank you so much for joining us today. I'm Priya, a UX Researcher here, and Maya, our lead designer, is also on the call."),
        ("Chris Evans", "Hi Priya, hi Maya. Happy to be here and help out."),
        ("Priya Sharma", "Today we want to talk about how you currently use our dashboard and show you some early concepts we're working on for a redesign."),
        ("Priya Sharma", "To start, could you walk me through a typical day? How much time do you spend in the application?"),
        ("Chris Evans", "I probably spend about 2 hours a day in the tool. I'm constantly jumping between reading meeting summaries and checking my action items."),
        ("Priya Sharma", "What would you say is your biggest frustration with the current setup?"),
        ("Chris Evans", "Honestly, it's the search and navigation. If I'm looking for a specific decision made three weeks ago, it takes way too many clicks to find the right meeting."),
        ("Maya Patel", "That's really helpful context, Chris. If you don't mind, I'm going to share my screen and show you a prototype we've been working on to address some of these issues."),
        ("Chris Evans", "Sure, let's see it."),
        ("Maya Patel", "As you can see, we've moved to a more card-based layout on the homepage. This unified view tries to bring your upcoming meetings, recent summaries, and pending action items all into one screen."),
        ("Chris Evans", "Oh, I like that immediately. Having the action items right next to the recent meetings makes a lot of sense."),
        ("Maya Patel", "We also completely revamped the filtering system here on the left. You can now filter by date range, specific participants, or even keywords."),
        ("Chris Evans", "The participant filter is huge for me. Half the time I remember WHO was in the meeting, but not the exact date."),
        ("Priya Sharma", "Is there anything missing from this view that you'd expect to see?"),
        ("Chris Evans", "Visually it's great, but one thing I notice is a lack of keyboard shortcuts. For power users like me, having a quick 'command-K' type search would be a game changer."),
        ("Maya Patel", "That's a fantastic suggestion. We haven't built that into the prototype yet, but I'll definitely add it to our design requirements."),
        ("Chris Evans", "Also, is there a way to customize these widgets? Like, what if I care more about action items than upcoming meetings?"),
        ("Maya Patel", "Not in this current iteration, but customizable widgets is something we're considering for a later phase."),
        ("Priya Sharma", "If you had to rank the features we've discussed today—global search, unified view, and keyboard shortcuts—what's most important?"),
        ("Chris Evans", "Global search, without a doubt. Then the unified view, and finally the shortcuts."),
        ("Priya Sharma", "Thank you so much, Chris. This feedback is incredibly valuable. We'll be sending you a gift card as a token of our appreciation."),
        ("Chris Evans", "Thanks, team! Looking forward to seeing these updates live.")
    ]
    db.add_all(create_segments(m4, m4_dialogue, m4.duration_seconds))

    # --- Meeting 5: Weekly All-Hands ---
    m5 = Meeting(
        title="Weekly All-Hands Standup",
        date=datetime.fromisoformat("2024-01-19T09:00:00"),
        duration_seconds=2400
    )
    m5.participants.extend([
        participants_map["Sarah Chen"], participants_map["Alex Rivera"], 
        participants_map["Jordan Park"], participants_map["Lisa Wang"], 
        participants_map["Tom Bradley"]
    ])
    db.add(m5)
    db.flush()

    db.add(Summary(meeting_id=m5.id, overview_text="Weekly all-hands standup covering progress across engineering, product, and design. Key updates: the API performance optimization reduced response times by 40%, the frontend team completed the new component library migration, and the auth service migration is on track for completion by end of month. Cross-team dependency identified between the dashboard redesign and the new API endpoints — Alex and Jordan to coordinate on integration timeline. Lisa flagged a potential risk with the upcoming infrastructure migration that could affect deployment schedules. The team agreed to implement a feature flag system to enable safer rollouts. Overall sprint velocity is trending 15% above the quarterly average."))

    db.add_all([
        Topic(meeting_id=m5.id, title="Product & PM Updates", start_time_seconds=0),
        Topic(meeting_id=m5.id, title="Backend Engineering Updates", start_time_seconds=420),
        Topic(meeting_id=m5.id, title="Frontend & Design Updates", start_time_seconds=960),
        Topic(meeting_id=m5.id, title="Cross-team Dependencies", start_time_seconds=1560),
        Topic(meeting_id=m5.id, title="Risks, Blockers & Week Ahead", start_time_seconds=2040),
    ])

    db.add_all([
        ActionItem(meeting_id=m5.id, text="Coordinate API integration timeline between backend and frontend teams", assignee_id=participants_map["Alex Rivera"].id, is_completed=False, due_date=date.fromisoformat("2024-01-22")),
        ActionItem(meeting_id=m5.id, text="Set up feature flag system for gradual rollouts", assignee_id=participants_map["Tom Bradley"].id, is_completed=False, due_date=date.fromisoformat("2024-01-26")),
        ActionItem(meeting_id=m5.id, text="Prepare infrastructure migration impact assessment", assignee_id=participants_map["Lisa Wang"].id, is_completed=False, due_date=date.fromisoformat("2024-01-24")),
        ActionItem(meeting_id=m5.id, text="Update project roadmap with revised Q1 milestones", assignee_id=participants_map["Sarah Chen"].id, is_completed=True, due_date=date.fromisoformat("2024-01-19")),
        ActionItem(meeting_id=m5.id, text="Complete component library documentation", assignee_id=participants_map["Jordan Park"].id, is_completed=False, due_date=date.fromisoformat("2024-01-24")),
        ActionItem(meeting_id=m5.id, text="Review and merge pending pull requests for API optimization", assignee_id=participants_map["Alex Rivera"].id, is_completed=True, due_date=date.fromisoformat("2024-01-19")),
    ])

    m5_dialogue = [
        ("Sarah Chen", "Morning everyone! Let's kick off our weekly all-hands. We've got a lot of ground to cover today."),
        ("Sarah Chen", "From a product standpoint, our sprint velocity is actually trending about 15% above the quarterly average, which is fantastic work."),
        ("Sarah Chen", "I've updated the project roadmap with the revised Q1 milestones. Let's move to engineering updates. Alex, how's the backend looking?"),
        ("Alex Rivera", "Good news on the API performance front. The optimization work we discussed on Monday is largely done."),
        ("Alex Rivera", "We're seeing response times reduced by almost 40% on the heavier endpoints, which is a huge win for the technical debt we were carrying."),
        ("Sarah Chen", "That's incredible, great job Alex. Jordan, over to you for frontend."),
        ("Jordan Park", "Thanks. The frontend team officially completed the new component library migration yesterday."),
        ("Jordan Park", "It took a bit longer than expected to handle some legacy CSS conflicts, but we're in a much cleaner state now."),
        ("Sarah Chen", "Excellent. Lisa, anything from the engineering management side?"),
        ("Lisa Wang", "Overall things are smooth. I did want to flag one potential risk though regarding the upcoming infrastructure migration next month."),
        ("Lisa Wang", "The infra team told me yesterday that there might be some brief periods where our staging environment is unstable."),
        ("Tom Bradley", "That actually affects my work too. Speaking of which, the auth service migration is on track for the end of the month, but I really need staging to be stable for final testing."),
        ("Lisa Wang", "Exactly. I'm going to prepare an impact assessment so we know exactly how this might affect our deployment schedules."),
        ("Alex Rivera", "Since we're pushing a lot of big changes soon—the dashboard, the auth migration—maybe we should look into a feature flag system?"),
        ("Alex Rivera", "It would make these rollouts a lot safer if we can just toggle things off if they break in production."),
        ("Tom Bradley", "I agree. I can take point on setting up a basic feature flag system. It shouldn't take more than a couple of days."),
        ("Sarah Chen", "I love that idea. Let's add that to the backlog and assign it to you, Tom."),
        ("Sarah Chen", "Let's talk dependencies. Jordan, your team is building the new dashboard widgets. Do you have everything you need from Alex's team?"),
        ("Jordan Park", "We have the mock data, but we still need the real endpoints for the 'recent meetings' view."),
        ("Alex Rivera", "I've got the PRs ready for those. I just need to get them reviewed and merged. I can have that done by end of day today."),
        ("Jordan Park", "Perfect. Let's coordinate on Slack on Monday to make sure the integration goes smoothly."),
        ("Sarah Chen", "Alright, let's wrap up with blockers and risks. Lisa, you mentioned the infra migration. Anything else?"),
        ("Lisa Wang", "Just making sure we get the component library documented, Jordan. We don't want knowledge silos."),
        ("Jordan Park", "Yep, I've got a ticket for that. Will tackle it next week."),
        ("Sarah Chen", "Great. Any other questions or concerns before we break?"),
        ("Alex Rivera", "None from me. Have a good weekend everyone!"),
        ("Tom Bradley", "Thanks, you too!"),
        ("Lisa Wang", "Bye everyone!"),
        ("Jordan Park", "See ya!"),
        ("Sarah Chen", "Thanks everyone, great work this week.")
    ]
    db.add_all(create_segments(m5, m5_dialogue, m5.duration_seconds))

    # Commit all changes
    db.commit()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    from database import SessionLocal
    db = SessionLocal()
    seed_database(db)
    db.close()
