import test, { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import * as jobController from "../controller.js";
import * as jobService from "../service.js";

describe("Job Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { _id: "user123" }
    };
    res = {
      status: mock.fn(function() { return this; }),
      json: mock.fn()
    };
    next = mock.fn();
    mock.restoreAll();
  });

  describe("createJobPosting", () => {
    it("should respond with 201 and created job", async () => {
      req.body = { title: "Test Job", skills: ["JS"] };
      
      const mockCreatedJob = { _id: "job123", ...req.body, recruiter: req.user._id };
      mock.method(jobService, "createJob", async () => mockCreatedJob);

      await jobController.createJobPosting(req, res, next);

      assert.strictEqual(jobService.createJob.mock.calls.length, 1);
      assert.deepStrictEqual(jobService.createJob.mock.calls[0].arguments, [req.body, req.user._id]);
      
      assert.strictEqual(res.status.mock.calls.length, 1);
      assert.deepStrictEqual(res.status.mock.calls[0].arguments, [201]);
      
      assert.strictEqual(res.json.mock.calls.length, 1);
      assert.deepStrictEqual(res.json.mock.calls[0].arguments, [{
        success: true,
        job: mockCreatedJob
      }]);
    });

    it("should pass errors to next()", async () => {
      const error = new Error("Database error");
      mock.method(jobService, "createJob", async () => { throw error; });

      await jobController.createJobPosting(req, res, next);

      assert.strictEqual(next.mock.calls.length, 1);
      assert.deepStrictEqual(next.mock.calls[0].arguments, [error]);
    });
  });
});
