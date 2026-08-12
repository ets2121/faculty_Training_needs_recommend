# QSU Faculty Training Needs Recommender

## Training Catalog and Transparent Prediction API

### 1. Goal

The system has two separate parts:

1.  **ML Prediction**
    -   Uses faculty questionnaire data.
    -   Predicts training-need categories.
    -   Returns the model's actual prediction scores/probabilities.
2.  **Training Catalog**
    -   Contains the actual training programs that can be recommended.
    -   Is NOT the ML model itself.
    -   Matches available training programs to the predicted training
        categories and faculty preferences.

Main flow:

Questionnaire → Feature Processing → ML Model → Transparent Prediction →
Catalog Matching → Recommended Training Programs

------------------------------------------------------------------------

## 2. Questionnaire Role

The questionnaire is used to collect the dataset used for model training
and also defines the input structure used by the production API.

The questionnaire contains:

-   Faculty profile
-   Training history
-   Competency proficiency
-   Competency importance
-   Emerging training needs
-   Preferred learning modality
-   Preferred schedule
-   Preferred duration
-   Barriers to training participation
-   Top five priority training topics

The current questionnaire includes emerging areas such as:

-   Artificial Intelligence
-   Machine Learning
-   Data Analytics
-   Cybersecurity
-   Cloud Computing
-   Learning Management Systems
-   Educational Technology
-   Statistical Software
-   Research Methods

It also includes competency areas such as teaching, research,
publication writing, quality assurance, technology transfer, leadership,
and other professional competencies.

The production API should follow the same logical input structure as the
questionnaire.

------------------------------------------------------------------------

## 3. What the ML Model Does

The ML model does NOT directly select a specific catalog title.

Instead, it predicts training-need categories based on the faculty data.

Example:

``` text
Faculty input
  ↓
ML model
  ↓
Artificial Intelligence: 0.87
Educational Technology: 0.76
Research Methods: 0.61
```

These are model predictions.

The catalog is used afterward to find actual available training
programs.

------------------------------------------------------------------------

## 4. Training Catalog

The catalog is a separate data source containing available training
programs.

Example catalog item:

``` text
training_id: TRN-001
title: Generative AI for Higher Education
description: Introduction to practical generative AI tools and responsible use in teaching, research, and academic work.
categories:
  - Artificial Intelligence
  - Educational Technology
target_competencies:
  - Computer Literacy and Digital Technologies
  - Effective Teaching and Classroom Management
modalities:
  - Webinar
  - Blended Learning
durations:
  - One day
  - Two days
schedules:
  - Saturdays
  - Semester Break
status: active
```

The catalog can contain many training programs.

Adding a new catalog item does not normally require retraining the ML
model if the item uses existing training categories/features that the
model already understands.

------------------------------------------------------------------------

## 5. Catalog Matching

After prediction, the system searches the catalog.

Example:

``` text
ML prediction:
Artificial Intelligence = 0.87
Educational Technology = 0.76

Catalog:
TRN-001 → Generative AI for Higher Education
TRN-014 → Digital Tools for Modern Teaching
TRN-021 → AI Tools for Academic Research
```

The recommendation service can consider:

-   Predicted training category
-   Prediction probability
-   Competency gaps
-   Preferred learning modality
-   Preferred schedule
-   Preferred duration
-   Training barriers
-   Catalog status

The final recommendation should come from the catalog, not directly from
a model class name.

------------------------------------------------------------------------

## 6. Important Rule About New Catalog Items

### Adding a new training program

No retraining is required when adding a new catalog program if:

-   The catalog item uses existing categories.
-   The existing model can already predict those categories.
-   The new program fits the existing questionnaire/model feature space.

Example:

``` text
Existing model category:
Artificial Intelligence

New catalog item:
AI-Powered Research Tools for Faculty

Result:
No model retraining required.
```

### Adding a completely new training category

Retraining may be required when the system needs to predict a category
that is not represented by the questionnaire/model.

Example:

``` text
New category:
Drone Technology

Current questionnaire:
No question measuring Drone Technology need.

Current model:
Does not predict Drone Technology.
```

To make this a true ML-predicted category:

1.  Add an appropriate questionnaire item.
2.  Collect new training data.
3.  Update the dataset.
4.  Retrain the model.
5.  Validate the model.
6.  Deploy the new model.

------------------------------------------------------------------------

## 7. Why Keep the Catalog Separate

Benefits:

-   Training programs can be added without retraining in normal cases.
-   Training titles and descriptions can change without changing the
    model.
-   Programs can be activated or deactivated.
-   Administrators can maintain the catalog.
-   The model remains focused on predicting training needs.
-   Recommendations can reflect currently available programs.
-   The system can explain how a catalog item matched a predicted need.

This separation also makes the system easier to maintain.

------------------------------------------------------------------------

# 8. Transparent Prediction API

The production API should expose both:

1.  **Model prediction**
2.  **Recommended training**

These must remain separate.

The prediction section shows what the ML model actually produced.

The recommendation section shows what the recommendation/catalog layer
selected.

------------------------------------------------------------------------

## 9. Expected API Response

Example:

``` json
{
  "status": "success",
  "model": {
    "status": "ready",
    "version": "20260807154126"
  },
  "prediction": {
    "top_predictions": [
      {
        "training_category": "Artificial Intelligence",
        "probability": 0.87,
        "rank": 1
      },
      {
        "training_category": "Educational Technology",
        "probability": 0.76,
        "rank": 2
      },
      {
        "training_category": "Research Methods",
        "probability": 0.61,
        "rank": 3
      }
    ],
    "all_predictions": [
      {
        "training_category": "Artificial Intelligence",
        "probability": 0.87
      },
      {
        "training_category": "Educational Technology",
        "probability": 0.76
      },
      {
        "training_category": "Research Methods",
        "probability": 0.61
      }
    ]
  },
  "recommendations": [
    {
      "training_id": "TRN-001",
      "title": "Generative AI for Higher Education",
      "category": "Artificial Intelligence",
      "match_score": 0.92,
      "reason": "Matches the predicted Artificial Intelligence training need."
    },
    {
      "training_id": "TRN-014",
      "title": "Digital Tools for Modern Teaching",
      "category": "Educational Technology",
      "match_score": 0.81,
      "reason": "Matches the predicted Educational Technology training need."
    }
  ]
}
```

------------------------------------------------------------------------

## 10. Meaning of Prediction Probability

A probability such as:

``` text
Artificial Intelligence = 0.87
```

means the model assigned a probability of 87% to that prediction.

It does NOT mean:

``` text
The model is 87% accurate.
```

Prediction probability and model accuracy are different measurements.

Model accuracy should be evaluated separately using the
training/validation/test process.

------------------------------------------------------------------------

## 11. Meaning of Recommendation Match Score

The `match_score` belongs to the recommendation layer.

Example:

``` text
prediction probability:
Artificial Intelligence = 0.87

catalog match:
Generative AI for Higher Education = 0.92
```

These numbers have different meanings.

`0.87` = ML model prediction probability.

`0.92` = recommendation/catalog matching score.

Do not present them as the same measurement.

------------------------------------------------------------------------

## 12. Frontend Usage

The frontend can show normal faculty users:

``` text
Recommended Training

1. Generative AI for Higher Education
2. Digital Tools for Modern Teaching
3. AI Tools for Academic Research
```

An administrator/researcher can have a separate:

``` text
View Prediction Details
```

section.

Example:

``` text
Model Version: 20260807154126

Top Model Predictions

Artificial Intelligence       87%
Educational Technology        76%
Research Methods              61%
```

This provides transparency without forcing normal users to understand
the ML internals.

------------------------------------------------------------------------

## 13. API Design Principle

Keep these concepts separate:

``` text
MODEL
  ↓
PREDICTION
  ↓
CATALOG MATCHING
  ↓
RECOMMENDATION
```

Do not combine the raw model prediction and the final catalog
recommendation into one unexplained value.

------------------------------------------------------------------------

## 14. Missing or Incomplete Faculty Data

A production faculty record may not contain every possible value.

Examples:

-   No training history
-   No administrative designation
-   No previous training records
-   Some optional profile fields are missing

The API should still be able to process the record when the model
supports missing/default values.

Missing data should not be invented.

Use appropriate defaults or preprocessing rules defined by the trained
model.

The system should clearly identify missing information when it affects
recommendation quality.

------------------------------------------------------------------------

## 15. Training History vs Current Training Need

Training history is evidence about what the faculty member attended
previously.

It should not automatically mean that the faculty member should receive
the same training again.

The model should use the complete questionnaire information, especially:

-   Competency proficiency
-   Competency importance
-   Emerging training needs
-   Training history
-   Preferences
-   Barriers

The catalog layer then selects available programs.

------------------------------------------------------------------------

## 16. AI Coding Agent Requirements

When implementing this system:

### Model layer

-   Load the trained model.
-   Load model labels/classes.
-   Return model version.
-   Provide `ready()` status.
-   Generate prediction probabilities.
-   Return ranked predictions.
-   Do not directly select catalog titles.

### Catalog layer

-   Load catalog data.
-   Filter inactive/unavailable programs.
-   Match predicted categories to catalog categories.
-   Consider faculty preferences where applicable.
-   Produce a recommendation score.
-   Return the actual catalog training ID and title.

### API layer

The response should contain:

``` text
status
model
prediction
recommendations
```

The API should not hide the model prediction behind the recommendation
result.

------------------------------------------------------------------------

## 17. Final Architecture

``` text
                    QUESTIONNAIRE
                         │
                         ▼
                  FACULTY INPUT
                         │
                         ▼
                  FEATURE PROCESSOR
                         │
                         ▼
                    ML MODEL
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
      MODEL PREDICTION          MODEL VERSION
             │
             ▼
     TRANSPARENT OUTPUT
             │
             ▼
      CATALOG MATCHING
             │
             ▼
    RECOMMENDED TRAINING
```

The important design rule is:

**The ML model predicts training needs. The catalog provides the actual
training programs.**

This allows the system to remain flexible while keeping the ML
prediction transparent.
