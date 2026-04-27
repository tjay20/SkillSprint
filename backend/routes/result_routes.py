from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, desc
from sqlalchemy.orm import Session

from auth import get_current_user, require_admin
from database import get_db
from models import QuizSubmission, ResultVisibility, User
from schemas import ResultVisibilityOut, ResultVisibilityUpdate, StudentResultOut

router = APIRouter()


@router.get("/results/me", response_model=dict)
def get_student_result(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Student retrieves their own result.
    Checks if results are online for their class/year/subject combo.
    """
    # Get the latest quiz submission for the student
    submission = (
        db.query(QuizSubmission)
        .filter(QuizSubmission.user_id == current_user.id)
        .order_by(desc(QuizSubmission.submitted_at))
        .first()
    )

    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No quiz submissions found")

    # Check if results are online for this student's class/year/subject
    visibility = (
        db.query(ResultVisibility)
        .filter(
            and_(
                ResultVisibility.year == current_user.year,
                ResultVisibility.branch == current_user.branch,
                ResultVisibility.division == current_user.division,
                ResultVisibility.subject == current_user.subject,
            )
        )
        .first()
    )

    # If no visibility record exists, default to online (True)
    is_online = True if not visibility else visibility.is_online

    if not is_online:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Results are currently offline")

    # Return student result with profile info
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "avatar_url": current_user.avatar_url,
        "srn": current_user.srn,
        "prn": current_user.prn,
        "year": current_user.year,
        "branch": current_user.branch,
        "division": current_user.division,
        "roll_no": current_user.roll_no,
        "score": submission.score,
        "total_questions": submission.total_questions,
        "submitted_at": submission.submitted_at,
    }


@router.get("/results/admin/students", response_model=List[StudentResultOut])
def get_filtered_student_results(
    year: Optional[int] = Query(None),
    branch: Optional[str] = Query(None),
    division: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Admin retrieves filtered student results by year, branch, division, subject.
    """
    query = db.query(QuizSubmission).join(User)

    if year is not None:
        query = query.filter(User.year == year)
    if branch:
        query = query.filter(User.branch == branch)
    if division:
        query = query.filter(User.division == division)
    if subject:
        query = query.filter(User.subject == subject)

    submissions = query.order_by(desc(QuizSubmission.submitted_at)).all()

    results = []
    for submission in submissions:
        result = StudentResultOut(
            id=submission.user.id,
            name=submission.user.name,
            email=submission.user.email,
            avatar_url=submission.user.avatar_url,
            srn=submission.user.srn,
            prn=submission.user.prn,
            year=submission.user.year,
            branch=submission.user.branch,
            division=submission.user.division,
            roll_no=submission.user.roll_no,
            quiz_score=submission.score,
            total_questions=submission.total_questions,
            submission_count=db.query(QuizSubmission).filter(QuizSubmission.user_id == submission.user.id).count(),
            submitted_at=submission.submitted_at,
        )
        results.append(result)

    return results


@router.put("/results/admin/visibility", response_model=ResultVisibilityOut)
def update_result_visibility(
    visibility_update: ResultVisibilityUpdate,
    year: int = Query(...),
    branch: str = Query(...),
    division: str = Query(...),
    subject: str = Query(...),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Admin toggles result visibility (online/offline) for a class/year/subject combo.
    """
    visibility = (
        db.query(ResultVisibility)
        .filter(
            and_(
                ResultVisibility.year == year,
                ResultVisibility.branch == branch,
                ResultVisibility.division == division,
                ResultVisibility.subject == subject,
            )
        )
        .first()
    )

    if not visibility:
        # Create new visibility record
        visibility = ResultVisibility(
            year=year,
            branch=branch,
            division=division,
            subject=subject,
            is_online=visibility_update.is_online,
            updated_by=current_user.id,
            updated_at=datetime.utcnow(),
        )
    else:
        # Update existing record
        visibility.is_online = visibility_update.is_online
        visibility.updated_by = current_user.id
        visibility.updated_at = datetime.utcnow()

    db.add(visibility)
    db.commit()
    db.refresh(visibility)

    return ResultVisibilityOut.model_validate(visibility)


@router.get("/results/admin/visibility", response_model=List[ResultVisibilityOut])
def get_visibility_settings(
    current_user: User = Depends(require_admin), db: Session = Depends(get_db)
):
    """
    Admin retrieves all result visibility settings.
    """
    visibilities = db.query(ResultVisibility).all()
    return [ResultVisibilityOut.model_validate(v) for v in visibilities]
