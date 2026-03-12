"""Project and environment management endpoints.

Follows rest-api-design-patterns skill:
- Collection and Item Resources
- Nested Resources
- Doppler-inspired project -> environment hierarchy
- Global project with inheritance
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status

from achilles.auth import get_current_user
from achilles.models import EnvironmentCreate, ProjectCreate, ProjectResponse

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    request: Request,
    body: ProjectCreate,
    user: dict = Depends(get_current_user),
):
    """Create a new project with default environments (dev, staging, prod)."""
    db = request.app.state.db

    if body.name == "Global":
        raise HTTPException(status_code=400, detail="'Global' is a reserved project name")

    try:
        project = await db.create_project(body.name, body.description)
    except Exception:
        raise HTTPException(status_code=409, detail="Project name already exists")

    await db.log_audit("project.create", "project", user["username"], project["id"])

    return ProjectResponse(
        id=project["id"],
        name=project["name"],
        description=project["description"],
        is_global=False,
        created_at=project["created_at"],
        updated_at=project["created_at"],
    )


@router.get("")
async def list_projects(
    request: Request,
    user: dict = Depends(get_current_user),
):
    """List all projects. The Global project is always first."""
    db = request.app.state.db
    projects = await db.list_projects()
    projects.sort(key=lambda p: (not p.get("is_global", False), -p.get("created_at", 0)))
    return projects


@router.get("/{project_id}")
async def get_project(
    request: Request,
    project_id: str,
    user: dict = Depends(get_current_user),
):
    """Get project details with environments."""
    db = request.app.state.db

    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    environments = await db.list_environments(project_id)
    return {**project, "environments": environments}


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    request: Request,
    project_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete a project and all its secrets. Cannot delete the Global project."""
    db = request.app.state.db

    try:
        success = await db.delete_project(project_id)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

    if not success:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.log_audit("project.delete", "project", user["username"], project_id)


@router.get("/{project_id}/environments")
async def list_environments(
    request: Request,
    project_id: str,
    user: dict = Depends(get_current_user),
):
    """List environments for a project."""
    db = request.app.state.db

    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return await db.list_environments(project_id)


@router.post("/{project_id}/environments", status_code=status.HTTP_201_CREATED)
async def create_environment(
    request: Request,
    project_id: str,
    body: EnvironmentCreate,
    user: dict = Depends(get_current_user),
):
    """Create a custom environment in a project."""
    db = request.app.state.db

    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        env = await db.create_environment(project_id, body.name, body.description)
    except Exception:
        raise HTTPException(status_code=409, detail="Environment already exists")

    await db.log_audit(
        "environment.create", "environment", user["username"], env["id"],
        details={"project_id": project_id, "name": body.name},
    )

    return env
