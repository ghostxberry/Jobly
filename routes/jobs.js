"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth"); // Adjusted import
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdateSchema.json");

const router = new express.Router();

/** POST / { job } => { job }
 * 
 * Job data should be { title, salary, equity, companyHandle }
 * 
 * Returns { id, title, salary, equity, companyHandle }
 * 
 * Authorization required: admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    console.log("Received POST request to create a new job");
    console.log("Request body:", req.body);

    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      console.log("Validation errors:", errs);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    console.log("Created job:", job);
    return res.status(201).json({ job });
  } catch (e) {
    console.error("Error:", e);
    return next(e);
  }
});

/** GET / => { jobs: [ { id, title, salary, equity, companyHandle, companyName }, ... ] }
 * 
 * Can filter on provided search filters:
 * - title
 * - minSalary
 * - hasEquity
 */

router.get("/", async function (req, res, next) {
  const q = req.query;

  // Validate query parameters
  if (!isValidQuery(q)) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  try {
    console.log("Received GET request to fetch all jobs");
    console.log("Query parameters:", q);

    const jobs = await Job.filter(q);
    
    // Check if any jobs were found
    if (jobs.length === 0) {
      return res.status(404).json({ error: 'No jobs found' });
    }

    console.log("Fetched jobs:", jobs);
    return res.json({ jobs });
  } catch (err) {
    console.error("Error:", err);
    return next(err);
  }
});

function isValidQuery(query) {
  // Define an array of valid query parameter keys
  const validKeys = ['title', 'salary', 'hasEquity'];

  // Check if every key in the query object is a valid key
  const isValid = Object.keys(query).every(key => validKeys.includes(key));

  return isValid;
}




/** GET /[id] => { job }
 * 
 * ✔️ works
 * 
 * Job is { id, title, salary, equity, companyHandle, company }
 */

router.get("/:id", async function (req, res, next) { // Removed ensureLoggedIn
  try {
    console.log("Received GET request to fetch job by ID:", req.params.id);

    const job = await Job.get(req.params.id);
    console.log("Fetched job:", job);
    return res.json({ job });
  } catch (err) {
    console.error("Error:", err);
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 * 
 * Patches job data.
 * 
 * fields can be: { title, salary, equity }
 * 
 * Returns { id, title, salary, equity, companyHandle }
 * 
 * Authorization required: admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
  try {
    console.log("Received PATCH request to update job by ID:", req.params.id);
    console.log("Request body:", req.body);

    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      console.log("Validation errors:", errs);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    console.log("Updated job:", job);
    return res.json({ job });
  } catch (e) {
    console.error("Error:", e);
    return next(e);
  }
});

/** DELETE /[id] => { deleted: id }
 * 
 *  ✔️ works
 * 
 * Authorization required: admin
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    console.log("Received DELETE request to delete job by ID:", req.params.id);
    
    await Job.remove(req.params.id);
    console.log("Deleted job with ID:", req.params.id);
    
    return res.json({ deleted: req.params.id });
  } catch (e) {
    console.error("Error:", e);
    return next(e);
  }
});

module.exports = router;
