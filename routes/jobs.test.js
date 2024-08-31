"use strict";

const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll } = require("./_testCommon");
const { BadRequestError, NotFoundError } = require("../expressError");
const db = require("../db");
const Job = require("../models/job");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("Job", () => {
  beforeEach(async () => {
    await db.query("DELETE FROM jobs");
    await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle)
           VALUES ('Software Engineer', 80000, 0.05, 'company1'),
                  ('Data Analyst', 60000, 0.03, 'company2'),
                  ('Product Manager', 100000, 0.02, 'company3')`
    );
  });

  describe("create", () => {
    test("creates a new job", async () => {
      const newJob = await Job.create({
        title: "Marketing Specialist",
        salary: 70000,
        equity: 0.01,
        company_handle: "company4"
      });
      expect(newJob).toEqual({
        title: "Marketing Specialist",
        salary: 70000,
        equity: 0.01,
        company_handle: "company4"
      });
    });

    test("throws error if job title already exists", async () => {
      try {
        await Job.create({
          title: "Software Engineer",
          salary: 90000,
          equity: 0.02,
          company_handle: "company5"
        });
      } catch (error) {
        expect(error instanceof BadRequestError).toBeTruthy();
      }
    });
  });

  describe("findAll", () => {
    test("returns all jobs", async () => {
      const jobs = await Job.findAll();
      expect(jobs.length).toBe(3);
    });
  });

  describe("get", () => {
    test("gets a specific job by id", async () => {
      const job = await Job.get(1);
      expect(job).toEqual({
        id: 1,
        title: "Software Engineer",
        salary: 80000,
        equity: 0.05,
        company_handle: "company1"
      });
    });

    test("throws error if job not found", async () => {
      try {
        await Job.get(999);
      } catch (error) {
        expect(error instanceof NotFoundError).toBeTruthy();
      }
    });
  });

  describe("update", () => {
    test("updates a job", async () => {
      const updatedJob = await Job.update(1, {
        title: "Software Developer",
        salary: 85000,
        equity: 0.06
      });
      expect(updatedJob).toEqual({
        title: "Software Developer",
        salary: 85000,
        equity: 0.06,
        company_handle: "company1"
      });
    });

    test("throws error if job not found", async () => {
      try {
        await Job.update(999, {
          title: "Software Developer",
          salary: 85000,
          equity: 0.06
        });
      } catch (error) {
        expect(error instanceof NotFoundError).toBeTruthy();
      }
    });
  });

  describe("remove", () => {
    test("removes a job", async () => {
      await Job.remove(1);
      const res = await db.query("SELECT * FROM jobs");
      expect(res.rows.length).toBe(2);
    });

    test("throws error if job not found", async () => {
      try {
        await Job.remove(999);
      } catch (error) {
        expect(error instanceof NotFoundError).toBeTruthy();
      }
    });
  });
});

