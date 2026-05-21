import test, { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import * as jobService from "../service.js";
import JobPosting from "../../../database/models/JobPosting.js";
import JobApplication from "../../../database/models/JobApplication.js";
import AppError from "../../../utils/AppError.js";

describe("Job Service", () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  describe("createJob", () => {
    it("should successfully create a job posting", async () => {
      const mockJobData = { title: "Software Engineer", skills: ["React", "Node"] };
      const mockRecruiterId = "recruiter123";
      
      const mockCreatedJob = { ...mockJobData, recruiter: mockRecruiterId, _id: "job123" };
      mock.method(JobPosting, "create", async () => mockCreatedJob);

      const result = await jobService.createJob(mockJobData, mockRecruiterId);

      assert.strictEqual(JobPosting.create.mock.calls.length, 1);
      assert.deepStrictEqual(JobPosting.create.mock.calls[0].arguments, [{
        ...mockJobData,
        recruiter: mockRecruiterId,
      }]);
      assert.deepStrictEqual(result, mockCreatedJob);
    });
  });

  describe("updateJob", () => {
    it("should update a job successfully when user is the owner", async () => {
      const mockJobId = "job123";
      const mockRecruiterId = "recruiter123";
      const mockUpdateData = { title: "Senior Software Engineer" };

      const mockExistingJob = { _id: mockJobId, recruiter: { toString: () => mockRecruiterId } };
      const mockUpdatedJob = { ...mockExistingJob, ...mockUpdateData };

      mock.method(JobPosting, "findById", async () => mockExistingJob);
      mock.method(JobPosting, "findByIdAndUpdate", async () => mockUpdatedJob);

      const result = await jobService.updateJob(mockJobId, mockUpdateData, mockRecruiterId);

      assert.strictEqual(JobPosting.findById.mock.calls.length, 1);
      assert.deepStrictEqual(JobPosting.findById.mock.calls[0].arguments, [mockJobId]);
      
      assert.strictEqual(JobPosting.findByIdAndUpdate.mock.calls.length, 1);
      assert.deepStrictEqual(JobPosting.findByIdAndUpdate.mock.calls[0].arguments, [
        mockJobId,
        mockUpdateData,
        { new: true, runValidators: true }
      ]);
      assert.deepStrictEqual(result, mockUpdatedJob);
    });

    it("should throw AppError(404) if job not found", async () => {
      mock.method(JobPosting, "findById", async () => null);

      await assert.rejects(
        async () => await jobService.updateJob("invalidId", {}, "recruiter123"),
        (err) => {
          assert.ok(err instanceof AppError);
          assert.strictEqual(err.statusCode, 404);
          return true;
        }
      );
    });

    it("should throw AppError(403) if recruiter is not the owner", async () => {
      const mockExistingJob = { _id: "job123", recruiter: { toString: () => "differentRecruiter" } };
      mock.method(JobPosting, "findById", async () => mockExistingJob);

      await assert.rejects(
        async () => await jobService.updateJob("job123", {}, "recruiter123"),
        (err) => {
          assert.ok(err instanceof AppError);
          assert.strictEqual(err.statusCode, 403);
          return true;
        }
      );
    });
  });

  describe("deleteJob", () => {
    it("should delete a job and its applications when user is owner", async () => {
      const mockJobId = "job123";
      const mockRecruiterId = "recruiter123";

      const mockExistingJob = { _id: mockJobId, recruiter: { toString: () => mockRecruiterId } };
      
      mock.method(JobPosting, "findById", async () => mockExistingJob);
      mock.method(JobApplication, "deleteMany", async () => ({ deletedCount: 5 }));
      mock.method(JobPosting, "findByIdAndDelete", async () => mockExistingJob);

      await jobService.deleteJob(mockJobId, mockRecruiterId);

      assert.strictEqual(JobPosting.findById.mock.calls.length, 1);
      assert.deepStrictEqual(JobPosting.findById.mock.calls[0].arguments, [mockJobId]);
      
      assert.strictEqual(JobApplication.deleteMany.mock.calls.length, 1);
      assert.deepStrictEqual(JobApplication.deleteMany.mock.calls[0].arguments, [{ job: mockJobId }]);
      
      assert.strictEqual(JobPosting.findByIdAndDelete.mock.calls.length, 1);
      assert.deepStrictEqual(JobPosting.findByIdAndDelete.mock.calls[0].arguments, [mockJobId]);
    });
  });
});
