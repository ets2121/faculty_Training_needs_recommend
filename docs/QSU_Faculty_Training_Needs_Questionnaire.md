# QSU Faculty Training Needs Assessment Questionnaire

**Study Title:** Design and Development of a QSU Faculty Training Needs
Recommender System

------------------------------------------------------------------------

## PART I. RESPONDENT PROFILE

**Instruction:** Please provide the following information.

**Name (Optional):**
\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

### 1. Department/College

*Please check what applies.*

-   [ ] BSCE
-   [ ] BEED
-   [ ] BSBA
-   [ ] BSCS
-   [ ] BAELS
-   [ ] BSMATH
-   [ ] BSHM
-   [ ] BSMidwifery
-   [ ] BSHM

### 2. Age

------------------------------------------------------------------------

### 3. Sex

-   [ ] Male
-   [ ] Female

### 4. Employment Status

-   [ ] Permanent
-   [ ] Contract of Service
-   [ ] Part-time

### 5. Academic Rank

------------------------------------------------------------------------

### 6. Highest Educational Attainment

-   [ ] Bachelor's Degree
-   [ ] Master's Degree
-   [ ] Doctorate Degree

### 7. Field of Specialization

------------------------------------------------------------------------

### 8. Years in Teaching

-   [ ] Below 5 years
-   [ ] 5--10 years
-   [ ] 11--15 years
-   [ ] 16--20 years
-   [ ] More than 20 years

### 9. Current Administrative Designation (if any)

------------------------------------------------------------------------

------------------------------------------------------------------------

## PART II. TRAINING HISTORY

**Instruction:** Please answer the following questions and check the
applicable choices.

### 1. Number of professional development trainings attended during the last three (3) years

-   [ ] None
-   [ ] 1--2
-   [ ] 3--5
-   [ ] More than 5

### 2. Areas of training attended

*Check all that apply.*

-   [ ] Instruction
-   [ ] Research
-   [ ] Extension
-   [ ] Quality Assurance
-   [ ] Information Technology
-   [ ] Leadership
-   [ ] Outcomes-Based Education

------------------------------------------------------------------------

## PART III. COMPETENCY ASSESSMENT

**Instruction:** For each competency, provide a rating for both your
current level of proficiency and its importance to your job.

### A. Current Level of Proficiency

    Rating Description
  -------- --------------
         1 No Knowledge
         2 Basic
         3 Intermediate
         4 Advanced
         5 Expert

### B. Importance to Job

    Rating Description
  -------- ----------------------
         1 Not Important
         2 Slightly Important
         3 Moderately Important
         4 Very Important
         5 Extremely Important

### Core Competencies

1.  Delivering Service Excellence
2.  Interpersonal Relationship
3.  Professionalism
4.  Achievement Orientation

### Functional Competencies

1.  Consultancy and Advising
2.  Critical Thinking and Problem Solving
3.  Effective Teaching and Classroom Management
4.  Innovative Instructional Material Development
5.  Computer Literacy and Digital Technologies
6.  Research Competency
7.  Publication Writing
8.  Quality Assurance Management
9.  Technology Transfer and Innovation
10. Outcomes-Based Education

### Leadership Competencies

1.  Strategic Thinking
2.  Leading Change
3.  Building Collaborative Relationships
4.  Coaching and Mentoring
5.  Managing Performance

**Assessment count:** 19 competencies, each with two ratings (current
proficiency and job importance), for a total of 38 ratings.

------------------------------------------------------------------------

## PART IV. EMERGING TRAINING NEEDS

**Instruction:** Rate your need for training in each emerging area using
the scale below.

    Rating Description
  -------- ----------------
         1 No Need
         2 Low Need
         3 Moderate Need
         4 High Need
         5 Very High Need

### Items

1.  Artificial Intelligence
2.  Machine Learning
3.  Data Analytics
4.  Cybersecurity
5.  Cloud Computing
6.  Learning Management Systems
7.  Educational Technology
8.  Statistical Software
9.  Research Methods

**Assessment count:** 9 ratings.

------------------------------------------------------------------------

## PART V. PREFERRED LEARNING MODALITY

**Instruction:** Check all learning modalities that you prefer.

-   [ ] Face-to-Face Seminar
-   [ ] Webinar
-   [ ] Blended Learning
-   [ ] Coaching
-   [ ] Mentoring
-   [ ] Benchmarking
-   [ ] Project Immersion
-   [ ] Formal Schooling
-   [ ] Self-Paced Online Course

------------------------------------------------------------------------

## PART VI. TRAINING AVAILABILITY

### A. Preferred Schedule

**Instruction:** Select your preferred training schedule.

-   [ ] Semester Break
-   [ ] Summer
-   [ ] Saturdays
-   [ ] Fridays
-   [ ] Anytime

### B. Preferred Duration

**Instruction:** Select your preferred training duration.

-   [ ] Half-day
-   [ ] One day
-   [ ] Two days
-   [ ] Three days
-   [ ] One week

------------------------------------------------------------------------

## PART VII. BARRIERS TO TRAINING PARTICIPATION

**Instruction:** Rate the extent to which each factor hinders your
participation in training.

    Rating Description
  -------- ------------------
         1 Not a Barrier
         2 Slight Barrier
         3 Moderate Barrier
         4 Serious Barrier
         5 Major Barrier

### Items

1.  Heavy teaching workload
2.  Administrative responsibilities
3.  Lack of budget
4.  Time constraints
5.  Travel distance
6.  Family responsibilities
7.  Internet connectivity

**Assessment count:** 7 ratings.

------------------------------------------------------------------------

## PART VIII. TRAINING PRIORITIES

**Instruction:** Identify your TOP FIVE priority training topics.

1.  

    ------------------------------------------------------------------------

2.  

    ------------------------------------------------------------------------

3.  

    ------------------------------------------------------------------------

4.  

    ------------------------------------------------------------------------

5.  

    ------------------------------------------------------------------------

------------------------------------------------------------------------

# Implementation Notes for the Recommender System

These notes distinguish questionnaire data from the training catalog and
the model's output. They are implementation guidance, not additional
questionnaire questions.

## 1. Questionnaire data

Parts I--VII collect structured respondent information and
training-needs inputs:

-   Part I: Respondent profile
-   Part II: Training history
-   Part III: Competency assessment
-   Part IV: Emerging training needs
-   Part V: Preferred learning modality
-   Part VI: Training availability
-   Part VII: Barriers to training participation

Part VIII collects the respondent's own top-five training priorities as
text entries.

## 2. Training catalog

The training catalog is a separate source of available training
programs. It can contain training titles, descriptions, competency or
need areas addressed, target participants, delivery modalities,
duration, schedules, and other program details.

A catalog entry does not necessarily need to be an ML model class or
label. A recommendation-matching layer can map model-predicted training
needs to relevant catalog entries.

## 3. Model predictions and catalog recommendations

Keep the model's predictions separate from the catalog recommendations
in the API response:

-   **Model predictions:** The actual output of the trained model,
    including predicted labels or need areas and their
    scores/probabilities when available.
-   **Catalog recommendations:** Available training programs selected by
    matching the model's predicted needs with the training catalog and
    relevant respondent preferences.

This separation makes it clear which values came directly from the ML
model and which items were selected by the recommendation or matching
logic.

## 4. Adding training programs

Adding a new training program to the catalog does not automatically
require model retraining if the model predicts broader training-need
categories and the catalog matching layer maps those categories to
programs.

If the model directly predicts individual training-program labels,
adding new labels/classes generally requires updating the training data
and retraining or otherwise rebuilding the model.
