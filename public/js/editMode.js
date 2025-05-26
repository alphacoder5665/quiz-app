export let editMode = null;

export function setEditMode(value) {
  editMode = value;
}

export function getEditMode() {
  return editMode;
}

export function clearEditMode() {
  editMode = null;
}
