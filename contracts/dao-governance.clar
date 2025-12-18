;; DAO Governance Contract
;; A complete DAO implementation with treasury management, proposals, and voting

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-member (err u101))
(define-constant err-proposal-not-found (err u102))
(define-constant err-already-voted (err u103))
(define-constant err-voting-ended (err u104))
(define-constant err-proposal-not-passed (err u105))
(define-constant err-proposal-already-executed (err u106))
(define-constant err-insufficient-balance (err u107))
(define-constant err-invalid-amount (err u108))
(define-constant err-voting-not-ended (err u109))

;; Voting duration in blocks (approximately 1 week at 10 min/block)
(define-constant voting-duration u1008)

;; Quorum requirement (% of total members that must vote)
(define-constant quorum-percentage u20)

;; Approval threshold (% of votes needed to pass)
(define-constant approval-threshold u51)

;; Data Variables
(define-data-var proposal-count uint u0)
(define-data-var member-count uint u0)

;; Data Maps
(define-map members principal bool)

(define-map proposals
  uint
  {
    proposer: principal,
    title: (string-ascii 256),
    description: (string-ascii 1024),
    recipient: principal,
    amount: uint,
    start-block: uint,
    end-block: uint,
    yes-votes: uint,
    no-votes: uint,
    executed: bool,
    cancelled: bool
  }
)

(define-map votes
  {proposal-id: uint, voter: principal}
  {vote: bool, power: uint}
)

(define-map member-voting-power principal uint)

;; Private Functions

(define-private (is-member (account principal))
  (default-to false (map-get? members account))
)

(define-private (get-voting-power (account principal))
  (default-to u1 (map-get? member-voting-power account))
)

(define-private (has-voted (proposal-id uint) (voter principal))
  (is-some (map-get? votes {proposal-id: proposal-id, voter: voter}))
)

(define-private (calculate-quorum (total-votes uint))
  (/ (* (var-get member-count) quorum-percentage) u100)
)

(define-private (calculate-approval (yes-votes uint) (total-votes uint))
  (if (> total-votes u0)
    (>= (/ (* yes-votes u100) total-votes) approval-threshold)
    false
  )
)

;; Read-Only Functions

(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals proposal-id)
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (map-get? votes {proposal-id: proposal-id, voter: voter})
)

(define-read-only (is-dao-member (account principal))
  (is-member account)
)

(define-read-only (get-member-power (account principal))
  (get-voting-power account)
)

(define-read-only (get-treasury-balance)
  (stx-get-balance (as-contract tx-sender))
)

(define-read-only (get-proposal-count)
  (var-get proposal-count)
)

(define-read-only (get-member-count)
  (var-get member-count)
)

(define-read-only (has-proposal-passed (proposal-id uint))
  (match (map-get? proposals proposal-id)
    proposal
      (let
        (
          (total-votes (+ (get yes-votes proposal) (get no-votes proposal)))
          (quorum-met (>= total-votes (calculate-quorum total-votes)))
          (approved (calculate-approval (get yes-votes proposal) total-votes))
        )
        (and quorum-met approved)
      )
    false
  )
)

(define-read-only (is-voting-active (proposal-id uint))
  (match (map-get? proposals proposal-id)
    proposal
      (and
        (< block-height (get end-block proposal))
        (not (get executed proposal))
        (not (get cancelled proposal))
      )
    false
  )
)

;; Public Functions

;; Initialize DAO with founding members
(define-public (initialize-dao (founding-members (list 10 principal)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map add-member founding-members)
    (ok true)
  )
)

;; Add a new member (governance action)
(define-public (add-member (new-member principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-set members new-member true)
    (map-set member-voting-power new-member u1)
    (var-set member-count (+ (var-get member-count) u1))
    (print {event: "member-added", member: new-member})
    (ok true)
  )
)