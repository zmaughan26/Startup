const express = require('express');

const port = process.argv.length > 2 ? process.argv[2] : 4000;
const app = express();
const assignments = [];

app.use(express.json());
app.use(express.static('public'));

app.get('/api/assignments', (req, res) => {
  res.json(assignments);
});

app.post('/api/assignments', (req, res) => {
  const { name, className, dueDate } = req.body;

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof className !== 'string' ||
    !className.trim() ||
    typeof dueDate !== 'string' ||
    !dueDate.trim()
  ) {
    return res.status(400).json({
      error: 'Name, class, and due date are required.',
    });
  }

  const assignment = {
    id: Date.now(),
    name: name.trim(),
    className: className.trim(),
    dueDate: dueDate.trim(),
    completed: false,
  };

  assignments.push(assignment);
  res.status(201).json(assignment);
});

app.delete('/api/assignments/:id', (req, res) => {
  const assignmentId = Number(req.params.id);
  const assignmentIndex = assignments.findIndex(
    (assignment) => assignment.id === assignmentId
  );

  if (!Number.isSafeInteger(assignmentId) || assignmentIndex === -1) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  assignments.splice(assignmentIndex, 1);
  res.status(204).end();
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
