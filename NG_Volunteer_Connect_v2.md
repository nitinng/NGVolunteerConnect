**NG VOLUNTEER CONNECT**

*Product Definition & Execution Handoff*

+-----------------------------------------------------------------------+
| NavGurukul --- Volunteer Ecosystem Platform                           |
|                                                                       |
| Version 2.0 \| March 2026                                             |
+-----------------------------------------------------------------------+

For: Execution Team (Program Managers) & Developers

**1. Executive Summary**

NG Volunteer Connect is NavGurukul\'s central platform for onboarding,
managing, and measuring the contribution of volunteers across all
programs and initiatives. The MVP has been partially developed; this
document redefines the full product scope, corrected user flows,
volunteer taxonomy, impact valuation logic, and a prioritised execution
backlog for the program management team and developers taking over
post-MVP.

**What has changed since v1**

The following shifts have been made to the original concept and must be
reflected in all future development:

-   Volunteer taxonomy split into two distinct top-level groups:
    External and Internal

-   Backend now confirmed as Supabase (was undefined)

-   Impact valuation module added --- monetary value of volunteer work
    calculated from variable factors

-   Onboarding flow restructured per volunteer type

-   Skills CMS scope expanded to support volunteer-specific learning
    pathways

-   Role of \"Program Manager\" formalised as the primary execution team
    persona

**2. Volunteer Taxonomy**

All volunteers on the platform fall into one of two top-level groups.
This distinction drives onboarding paths, dashboard views, permissions,
and impact valuation logic.

  ------------------------------------------------------------------------
  **Group**        **Sub-Type**                **Description**
  ---------------- --------------------------- ---------------------------
  **External**     Individual Contributor      Professionals, freelancers,
                                               domain experts volunteering
                                               independently

  **External**     Corporate / CSR Partner     Employees from partner
                                               organisations volunteering
                                               under a CSR mandate

  **Internal**     Alumni --- External         NavGurukul graduates now
                                               working outside NG who want
                                               to give back

  **Internal**     Alumni --- Internal (Staff) NavGurukul graduates who
                                               have re-joined NG as
                                               full-time or part-time
                                               staff
  ------------------------------------------------------------------------

**Why this split matters**

-   External volunteers need a full public-facing onboarding journey and
    identity verification

-   Internal alumni (External) need a lighter onboarding flow since NG
    context is already known

-   Internal alumni (Staff) have partial system access already --- their
    volunteer record links to their staff profile

-   Corporate volunteers may have batch onboarding handled by a company
    coordinator rather than individually

**3. Corrected User Flows**

All user flows have been revised to reflect the updated volunteer
taxonomy, Supabase backend, and impact tracking requirements. Existing
flows in the codebase must be audited against these and migrated where
they diverge.

**3A. External Volunteer Flow**

Applies to: Individual Contributors and Corporate/CSR Volunteers

  ------------------------------------------------------------------------------
  **\#**   **Step**           **Description**                      **Owner**
  -------- ------------------ ------------------------------------ -------------
  **1**    **Discovery**      Volunteer finds the platform via     **System**
                              link, social, or partner referral    

  **2**    **Sign Up**        Clerk auth --- email/social SSO.     **System**
                              Auto-assigned role: Volunteer        
                              (External)                           

  **3**    **Type Selection** User selects Individual Contributor  **User**
                              or Corporate/CSR volunteer           

  **4**    **Basic Profile**  Name, location, LinkedIn, phone,     **User**
                              pronouns                             

  **5**    **Professional     Current role, employer, years of     **User**
           Profile**          exp, industry vertical, key skills   
                              (tagged)                             

  **6**    **Availability     Hours/week available, preferred      **User**
           Setup**            days, commitment duration (one-off / 
                              ongoing)                             

  **7**    **Orientation      Mandatory LMS: NG mission, student   **System +
           Modules**          profile, code of conduct,            User**
                              collaboration norms                  

  **8**    **Skill Tag        System suggests skill tags from      **User**
           Confirmation**     profile; user confirms/adds          

  **9**    **Dashboard        Volunteer dashboard unlocked ---     **System**
           Access**           browse projects, receive             
                              recommendations                      

  **10**   **Apply to         Filter/browse → Apply → Answer       **User**
           Project**          screening questions                  

  **11**   **Approval**       Auto-approved (open projects) or PM  **Program
                              review (curated projects)            Manager**

  **12**   **Project Work**   Log hours, submit deliverables,      **User**
                              communicate with PM via workspace    

  **13**   **Impact Logged**  System calculates monetary value per **System**
                              contribution entry                   

  **14**   **Completion &     Certificate issued, impact report    **System**
           Recognition**      generated, profile updated           
  ------------------------------------------------------------------------------

**3B. Internal Volunteer Flow --- Alumni (External)**

Applies to: NavGurukul graduates working outside the organisation

  ---------------------------------------------------------------------------------
  **\#**      **Step**           **Description**                      **Owner**
  ----------- ------------------ ------------------------------------ -------------
  **1**       **Invite /         NG ops team sends invite or alumni   **Ops /
              Self-Register**    registers and self-identifies as NG  User**
                                 alumni                               

  **2**       **Alumni           System checks against alumni         **System /
              Verification**     database (Supabase); PM manually     PM**
                                 confirms if not found                

  **3**       **Lightweight      Graduation year, campus, current     **User**
              Profile**          employer, skills --- pre-filled      
                                 where possible                       

  **4**       **Skip Core        NG mission modules skipped; only     **System**
              Orientation**      role-specific and code-of-conduct    
                                 modules shown                        

  **5**       **Skill Tag        Tag based on post-graduation career  **User**
              Setup**            growth --- crucial for impact        
                                 valuation                            

  **6**       **Dashboard        Same volunteer dashboard with        **System**
              Access**           alumni-specific badge and project    
                                 filter                               

  **7--14**   **Same as External Project browsing, application, work  **User / PM**
              Flow**             logging, and recognition identical   
  ---------------------------------------------------------------------------------

**3C. Internal Volunteer Flow --- Alumni (Staff)**

Applies to: NavGurukul graduates now employed by NavGurukul

  ---------------------------------------------------------------------------------
  **\#**      **Step**           **Description**                      **Owner**
  ----------- ------------------ ------------------------------------ -------------
  **1**       **Staff Profile    User already has an NG staff account **System**
              Exists**           in Clerk                             

  **2**       **Volunteer Mode   User activates \"Volunteer\" mode    **User**
              Toggle**           from their profile --- creates       
                                 linked volunteer record in Supabase  

  **3**       **Role             System stores both staff role and    **System**
              Clarification**    volunteer role; they are displayed   
                                 separately in analytics              

  **4**       **No Onboarding**  Orientation modules skipped entirely **System**
                                 --- staff already has org context    

  **5**       **Project Access** Can apply to volunteer projects      **User**
                                 outside their team scope             

  **6--14**   **Same Tracking**  Hours, contributions, and impact     **System /
                                 tracked separately from staff work   User**
  ---------------------------------------------------------------------------------

**3D. Program Manager Flow**

Applies to: Program, Operations, and Admin role users

  ------------------------------------------------------------------------------
  **\#**   **Step**           **Description**                      **Owner**
  -------- ------------------ ------------------------------------ -------------
  **1**    **Login**          PM logs in with Program/Admin role   **System**

  **2**    **Project          Define title, description, team,     **PM**
           Creation**         required skills (tags), duration,    
                              time commitment, volunteer count     
                              needed                               

  **3**    **Approval Mode**  Choose: Open (auto-approve) or       **PM**
                              Curated (PM reviews each             
                              application)                         

  **4**    **Screening        Optionally add 1--5 questions        **PM**
           Questions**        applicants must answer               

  **5**    **Publish**        Project goes live --- system matches **System**
                              and notifies relevant volunteers     

  **6**    **Application      PM views applicant profiles,         **PM**
           Review**           answers, skill match score           

  **7**    **Volunteer        PM can send project-specific         **PM**
           Onboarding**       onboarding notes to accepted         
                              volunteers                           

  **8**    **Monitor          Dashboard shows per-volunteer hours  **PM**
           Progress**         logged, tasks completed,             
                              contribution status                  

  **9**    **Approve Hours**  PM verifies and approves             **PM**
                              volunteer-submitted hours (triggers  
                              impact calculation)                  

  **10**   **Close Project**  Mark complete → generates impact     **PM**
                              report → triggers volunteer          
                              recognition                          
  ------------------------------------------------------------------------------

**4. Current Codebase Audit & Migration Plan**

The table below maps every major existing feature against the updated
product spec. Each item is labelled with its current state and the
action required to align it with v2 of the product.

  ---------------------------------------------------------------------------------------
  **Existing Feature /       **Status**     **Action**          **Migration Notes**
  File**                                                        
  -------------------------- -------------- ------------------- -------------------------
  Single Volunteer role      **Outdated**   **MIGRATE**         Add volunteer_type field
  (Clerk)                                                       (external_individual \|
                                                                external_corporate \|
                                                                internal_alumni_ext \|
                                                                internal_alumni_staff) to
                                                                Clerk public metadata and
                                                                Supabase profiles table

  Register flow (/register)  **Partial**    **EXTEND**          After Clerk sign-up, add
                                                                type-selection screen
                                                                before profile creation.
                                                                Route to correct
                                                                onboarding branch per
                                                                type

  OnboardingView.tsx         **Partial**    **RESTRUCTURE**     Current single-path
                                                                onboarding must branch
                                                                into 3 paths: Full
                                                                (External), Lightweight
                                                                (Alumni-Ext), Skip
                                                                (Staff). Gate orientation
                                                                modules per path

  VolunteerDashboard.tsx     **Exists**     **UPDATE**          Add volunteer_type badge.
                                                                Add project match score
                                                                indicator. Add progress
                                                                tracker for onboarding
                                                                completion

  SkillsManagementView.tsx   **Exists       **EXTEND**          Add volunteer-facing
                             (Admin)**                          skill tag confirmation
                                                                UI. Skills must be
                                                                searchable and
                                                                self-selectable by
                                                                volunteers at onboarding

  TasksView.tsx              **Exists**     **RENAME+EXTEND**   Rename to ProjectsView.
                                                                Extend to support project
                                                                application, status
                                                                tracking, and hour
                                                                logging by volunteers

  Users dashboard (/users)   **Exists       **EXTEND**          Add volunteer_type filter
                             (Admin)**                          column. Add impact value
                                                                column. Add alumni
                                                                verification status

  No backend (mock data)     **Missing**    **BUILD**           Implement Supabase schema
                                                                (see Section 5). Replace
                                                                all mock/static data with
                                                                Supabase queries via
                                                                server actions

  No impact valuation        **Missing**    **BUILD NEW**       Build impact calculation
                                                                engine (see Section 6).
                                                                Store results in
                                                                volunteer_contributions
                                                                table

  No project management      **Missing**    **BUILD NEW**       Build full project CRUD
                                                                for PMs. Volunteer
                                                                application flow. Hour
                                                                logging. PM approval
                                                                workflow

  No notification system     **Missing**    **BUILD NEW**       Email notifications via
                                                                Supabase Edge Functions
                                                                or Resend: project match,
                                                                application status, hour
                                                                approval, certificate

  skills-config.ts (static)  **Partial**    **MIGRATE**         Move skills/categories
                                                                from static config into
                                                                Supabase skill_categories
                                                                and skill_subcategories
                                                                tables. CMS becomes
                                                                source of truth
  ---------------------------------------------------------------------------------------

**5. Supabase Data Schema**

All application state moves from mock/static data to Supabase. Below are
the core tables required for MVP. Every table includes clerk_user_id as
the bridge between Clerk identity and Supabase data.

**profiles**

Master volunteer profile record. One row per user.

  ----------------------------------------------------------------------------------------
  **Column**                        **Type**      **Notes**
  --------------------------------- ------------- ----------------------------------------
  **id**                            uuid          PRIMARY KEY, default gen_random_uuid()

  **clerk_user_id**                 text          UNIQUE, NOT NULL --- links to Clerk
                                                  identity

  **volunteer_type**                text          external_individual \|
                                                  external_corporate \|
                                                  internal_alumni_ext \|
                                                  internal_alumni_staff

  **full_name**                     text          NOT NULL

  **email**                         text          NOT NULL

  **location**                      text          

  **linkedin_url**                  text          

  **current_role**                  text          

  **employer**                      text          

  **years_of_experience**           integer       

  **industry_vertical**             text          

  **availability_hours_per_week**   integer       

  **commitment_type**               text          one_off \| ongoing

  **alumni_verified**               boolean       DEFAULT false --- for internal alumni
                                                  types only

  **alumni_graduation_year**        integer       

  **alumni_campus**                 text          

  **corporate_company_name**        text          For external_corporate type

  **onboarding_completed**          boolean       DEFAULT false

  **created_at**                    timestamptz   DEFAULT now()
  ----------------------------------------------------------------------------------------

**volunteer_skills**

Many-to-many between profiles and skill tags.

  ------------------------------------------------------------------------------
  **Column**              **Type**      **Notes**
  ----------------------- ------------- ----------------------------------------
  **id**                  uuid          PRIMARY KEY

  **profile_id**          uuid          FK → profiles.id

  **skill_tag_id**        uuid          FK → skill_tags.id

  **proficiency_level**   text          beginner \| intermediate \| expert
  ------------------------------------------------------------------------------

**projects**

Volunteer projects created by Program Managers.

  ----------------------------------------------------------------------------------
  **Column**                     **Type**      **Notes**
  ------------------------------ ------------- -------------------------------------
  **id**                         uuid          PRIMARY KEY

  **created_by_clerk_id**        text          FK to PM\'s Clerk ID

  **title**                      text          NOT NULL

  **description**                text          

  **team**                       text          NG internal team (Tech, Curriculum,
                                               Ops, etc.)

  **required_skills**            uuid\[\]      Array of skill_tag_ids

  **volunteers_needed**          integer       

  **estimated_hours_per_week**   integer       

  **duration_weeks**             integer       

  **approval_mode**              text          open \| curated

  **screening_questions**        jsonb         Array of question strings

  **status**                     text          draft \| published \| completed \|
                                               archived

  **created_at**                 timestamptz   DEFAULT now()
  ----------------------------------------------------------------------------------

**volunteer_applications**

  ---------------------------------------------------------------------------
  **Column**              **Type**      **Notes**
  ----------------------- ------------- -------------------------------------
  **id**                  uuid          PRIMARY KEY

  **project_id**          uuid          FK → projects.id

  **profile_id**          uuid          FK → profiles.id

  **screening_answers**   jsonb         Array of answer strings mapped to
                                        questions

  **status**              text          pending \| approved \| rejected \|
                                        withdrawn

  **applied_at**          timestamptz   DEFAULT now()

  **reviewed_at**         timestamptz   

  **reviewed_by**         text          Clerk ID of PM who reviewed
  ---------------------------------------------------------------------------

**volunteer_contributions**

Core of the impact engine. Every logged work session is a row.

  ---------------------------------------------------------------------------------
  **Column**                   **Type**        **Notes**
  ---------------------------- --------------- ------------------------------------
  **id**                       uuid            PRIMARY KEY

  **project_id**               uuid            FK → projects.id

  **profile_id**               uuid            FK → profiles.id

  **date_of_work**             date            NOT NULL

  **hours_logged**             numeric(5,2)    NOT NULL

  **work_description**         text            

  **deliverable_url**          text            Link to submitted deliverable if any

  **pm_approved**              boolean         DEFAULT false

  **approved_by**              text            Clerk ID of approving PM

  **calculated_hourly_rate**   numeric(10,2)   Computed at approval time --- see
                                               Section 6

  **calculated_value**         numeric(10,2)   hours_logged ×
                                               calculated_hourly_rate

  **created_at**               timestamptz     DEFAULT now()
  ---------------------------------------------------------------------------------

**6. Impact Valuation Engine**

Every approved hour of volunteer work generates a monetary value
estimate. This is not pay --- it is a proxy for the market cost NG
avoids by using skilled volunteer labour. The calculation is
multi-factor, collapsible to a single headline number for reporting.

  ----------------------------------------------------------------------------------------------
  **Factor**             **Weight / Range**     **How it is Determined**
  ---------------------- ---------------------- ------------------------------------------------
  **Base Market Rate**   **₹500--₹10,000/hr**   Lookup table indexed by industry_vertical ×
                                                years_of_experience band (0--2, 3--5, 6--10, 10+
                                                years). Admin-configurable in CMS.

  **Skill Complexity     **1.0×--1.8×**         Project tags matched to volunteer skill tags.
  Multiplier**                                  Rare/high-demand skills (e.g. ML, Legal,
                                                Finance) apply a higher multiplier. Stored per
                                                skill_tag in DB.

  **Project Impact       **1.0×--1.5×**         PM assigns project an impact tier (Community /
  Tier**                                        Program / Strategic) at creation. Strategic =
                                                1.5×.

  **Experience Seniority **1.0×--1.4×**         Derived from years_of_experience: 0--2 = 1.0×,
  Band**                                        3--5 = 1.1×, 6--10 = 1.25×, 10+ = 1.4×.

  **Volunteer Type       **0.9×--1.0×**         Internal alumni (staff) adjusted slightly
  Adjustment**                                  downward (0.9×) as their base is NG-funded.
                                                External volunteers at 1.0×.

  **Final Hourly Rate    **Auto-calculated**    Base Rate × Skill Multiplier × Impact Tier ×
  (Computed)**                                  Seniority Band × Type Adjustment. Stored in
                                                volunteer_contributions.calculated_hourly_rate
                                                at PM approval.

  **Session Value**      **Auto-calculated**    hours_logged × calculated_hourly_rate. Stored in
                                                volunteer_contributions.calculated_value.

  **Cumulative Volunteer **Dashboard metric**   SUM(calculated_value) per profile across all
  Value**                                       approved contributions. Displayed on admin and
                                                volunteer dashboards.
  ----------------------------------------------------------------------------------------------

**Collapsible Summary View**

For program managers and leadership, the calculated value rolls up into
three summary tiers:

-   Session Value --- value of a single logged work session

-   Project Value --- total value across all volunteer contributions to
    one project

-   Cumulative Volunteer Value --- lifetime value generated by a single
    volunteer across all projects

-   Organisation Total --- aggregate of all approved contributions
    across all volunteers and projects for a selected period

These four numbers appear on the Admin Analytics Dashboard and can be
filtered by date range, volunteer type, team, and project.

**7. Execution To-Do List**

Tasks are ordered by Antigravity --- highest dependency-clearing tasks
first. P0 items must be completed before any P1 task can start. Red = P0
(blocker), Amber = P1 (next), Green = P2 (future).

  -------------------------------------------------------------------------------------
  **\#**   **Task**                   **Priority**   **Owner**       **Blocks / Depends
                                                                     on**
  -------- -------------------------- -------------- --------------- ------------------
  **F1**   Set up Supabase project +  **P0**         Dev             *All backend
           connect to Next.js via env                                tasks*
           vars                                                      

  **F2**   Create Supabase schema:    **P0**         Dev             *F1*
           profiles,                                                 
           volunteer_skills,                                         
           projects,                                                 
           volunteer_applications,                                   
           volunteer_contributions,                                  
           skill_tags                                                

  **F3**   Add volunteer_type field   **P0**         Dev             *F1, All flows*
           to Clerk public metadata;                                 
           update middleware                                         
           role-guard                                                

  **F4**   Build server actions to    **P0**         Dev             *F2, F3*
           sync Clerk user data →                                    
           Supabase profiles on first                                
           sign-in                                                   

  **A1**   Update /register: add      **P0**         Dev             *F3, F4*
           volunteer type selection                                  
           screen post-Clerk sign-up                                 

  **A2**   Build External Volunteer   **P0**         Dev             *A1, F2*
           onboarding (full 8-step                                   
           flow) with Supabase writes                                

  **A3**   Build Internal Alumni      **P0**         Dev             *A1, F2*
           (External) onboarding                                     
           (lightweight 6-step flow)                                 

  **A4**   Build Internal Staff       **P0**         Dev             *A1, F2*
           volunteer-mode toggle +                                   
           linked profile creation                                   

  **A5**   Build alumni verification  **P1**         Dev + PM        *A3*
           check against Supabase                                    
           alumni_directory table (or                                
           manual PM approval                                        
           fallback)                                                 

  **S1**   Migrate skills-config.ts   **P0**         Dev             *F2*
           to Supabase skill_tags,                                   
           skill_categories,                                         
           skill_subcategories tables                                

  **S2**   Build volunteer-facing     **P0**         Dev             *S1, A2*
           skill tag search +                                        
           confirmation UI at                                        
           onboarding step 8                                         

  **S3**   Build admin market rate    **P1**         Dev + PM        *S1*
           lookup table in CMS                                       
           (industry × experience                                    
           band → base rate)                                         

  **P1**   Build PM project creation  **P0**         Dev             *F2*
           form (all fields per                                      
           Section 5 schema)                                         

  **P2**   Build project listing +    **P0**         Dev             *P1, S1*
           search/filter for                                         
           volunteers (tag-based                                     
           match score)                                              

  **P3**   Build volunteer            **P0**         Dev             *P2*
           application flow (apply →                                 
           screening questions →                                     
           submit)                                                   

  **P4**   Build PM application       **P0**         Dev             *P3*
           review UI (view applicant                                 
           profile, answers,                                         
           approve/reject)                                           

  **P5**   Build volunteer project    **P0**         Dev             *P4*
           workspace: task log, hour                                 
           logging, deliverable                                      
           upload                                                    

  **P6**   Build PM hour approval     **P1**         Dev             *P5, I1*
           workflow + trigger impact                                 
           calculation on approval                                   

  **I1**   Build impact calculation   **P1**         Dev             *S3, F2*
           engine (Base Rate ×                                       
           Multipliers →                                             
           calculated_value)                                         

  **I2**   Add calculated_hourly_rate **P1**         Dev             *I1, P6*
           and calculated_value                                      
           writes to                                                 
           volunteer_contributions on                                
           PM approval                                               

  **I3**   Build volunteer impact     **P1**         Dev             *I2*
           summary card (session /                                   
           project / cumulative                                      
           views)                                                    

  **I4**   Build org-level impact     **P2**         Dev             *I2*
           analytics panel for                                       
           Admin/Ops (total hours,                                   
           total value, by type, by                                  
           period)                                                   

  **D1**   Update                     **P0**         Dev             *A2, P2*
           VolunteerDashboard.tsx:                                   
           add volunteer_type badge,                                 
           onboarding progress bar,                                  
           project match feed                                        

  **D2**   Update Admin/Ops user      **P0**         Dev             *F2*
           table: add volunteer_type                                 
           column, alumni_verified                                   
           column, impact value                                      
           column                                                    

  **D3**   Add dynamic time-range     **P1**         Dev             *F2, D2*
           filtering to analytics                                    
           charts (existing charts,                                  
           now Supabase-backed)                                      

  **N1**   Email: project match alert **P1**         Dev             *P1, S1*
           to volunteers when a new                                  
           matching project is                                       
           published                                                 

  **N2**   Email: application status  **P1**         Dev             *P4*
           notification (approved /                                  
           rejected)                                                 

  **N3**   Email: hour approval       **P2**         Dev             *P6*
           confirmation + session                                    
           impact value summary                                      

  **N4**   Email: project completion  **P2**         Dev             *P6*
           certificate trigger                                       

  **O1**   Build PM operations guide  **P0**         PM              *None*
           (SOP doc) for program                                     
           managers to hand off to                                   
           execution team                                            

  **O2**   Populate initial skill     **P0**         PM + Dev        *S1, S3*
           tags, categories, and                                     
           market rate table in CMS                                  
           before launch                                             

  **O3**   Create volunteer           **P0**         PM              *A2*
           onboarding orientation                                    
           module content (NG                                        
           mission, code of conduct)                                 

  **O4**   Define impact tier         **P1**         PM              *I1*
           classification for project                                
           types (Community / Program                                
           / Strategic)                                              
  -------------------------------------------------------------------------------------

**8. Program Manager Handoff Checklist**

This checklist must be completed before the platform goes live for
volunteer onboarding. It is the responsibility of the PM lead to tick
each item off in coordination with the developer.

  --------------------------------------------------------------------------
  **✓**   **Handoff Item**                            **Responsible**
  ------- ------------------------------------------- ----------------------
  ☐       This document reviewed and agreed upon by   **Dev Lead + PM Lead**
          dev team and PM lead                        

  ☐       Supabase project created and shared access  **Dev Lead**
          granted to dev team                         

  ☐       Clerk API keys and MASTER_USER_ID confirmed **Dev Lead**
          in production .env                          

  ☐       Skill categories and tags seeded into       **PM + Dev**
          production Supabase DB                      

  ☐       Market rate lookup table populated for all  **PM Lead**
          industry verticals                          

  ☐       Onboarding orientation module content       **PM Lead**
          written and uploaded to CMS                 

  ☐       At least 3 pilot projects created in the    **Program Manager**
          system before volunteer launch              

  ☐       Alumni directory table seeded for           **Ops / PM**
          verification of internal alumni             

  ☐       Email notification templates approved       **PM Lead**
          (application, approval, certificate)        

  ☐       Admin user(s) provisioned with correct      **Dev Lead**
          Clerk roles before go-live                  

  ☐       Volunteer pilot run: 5 external volunteers  **PM Lead**
          onboarded end-to-end as UAT                 

  ☐       Impact valuation parameters reviewed and    **PM Lead +
          confirmed by leadership                     Leadership**
  --------------------------------------------------------------------------
