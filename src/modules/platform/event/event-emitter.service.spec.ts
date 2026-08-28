import {
    EventEmitterService,
} from "./event-emitter.service"
import {
    EventName,
} from "./enums/event-name"
import {
    JobStatus,
} from "@modules/databases/postgresql/primary/enums/job-status"

describe("EventEmitterService",
    () => {
        const local = {
            emit: jest.fn(), on: jest.fn(), off: jest.fn()
        }
        const producer = {
            publish: jest.fn()
        }
        const factory = {
            create: jest.fn(() => "serialized")
        }
        const service = new EventEmitterService(local as never,
producer as never,
factory as never)

        beforeEach(() => jest.clearAllMocks())

        it("emits locally and publishes a serialized NATS message when both are requested",
            async () => {
                const payload = {
                    jobId: "job-1",
                    status: JobStatus.Queued,
                }
                await service.emit({
                    event: EventName.JobStatusUpdated,
                    payload,
                    options: {
                        useLocal: true, useNats: true
                    },
                })

                expect(local.emit).toHaveBeenCalledWith(EventName.JobStatusUpdated,
                    payload)
                expect(factory.create).toHaveBeenCalledWith({
                    message: payload
                })
                expect(producer.publish).toHaveBeenCalledWith({
                    subject: EventName.JobStatusUpdated,
                    payload: "serialized",
                })
            })

        it("fans job status out locally and through NATS by default",
            async () => {
                const payload = {
                    jobId: "job-live",
                    status: JobStatus.Completed,
                }

                await service.emit({
                    event: EventName.JobStatusUpdated,
                    payload,
                })

                expect(local.emit).toHaveBeenCalledWith(EventName.JobStatusUpdated,
                    payload)
                expect(producer.publish).toHaveBeenCalledWith({
                    subject: EventName.JobStatusUpdated,
                    payload: "serialized",
                })
            })

        it("registers and removes listeners using the resolved event name",
            () => {
                const listener = jest.fn()
                service.on({
                    event: EventName.JobStatusUpdated, listener
                })
                service.off({
                    event: EventName.JobStatusUpdated, listener
                })

                expect(local.on).toHaveBeenCalledWith(EventName.JobStatusUpdated,
                    listener)
                expect(local.off).toHaveBeenCalledWith(EventName.JobStatusUpdated,
                    listener)
            })

        it("honors explicit transport opt-outs without serializing the payload",
            async () => {
                await service.emit({
                    event: EventName.JobStatusUpdated,
                    payload: {
                        jobId: "job-2",
                        status: JobStatus.Queued,
                    },
                    options: {
                        useLocal: false,
                        useNats: false,
                    },
                })

                expect(local.emit).not.toHaveBeenCalled()
                expect(factory.create).not.toHaveBeenCalled()
                expect(producer.publish).not.toHaveBeenCalled()
            })
    })
