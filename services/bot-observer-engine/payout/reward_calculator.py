class RewardCalculator:
    @staticmethod
    def compute_match_payouts(tournament_config: dict, scoreboard_results: list) -> list:
        """
        Calculates exact BDT winnings per player based on:
        - 1st Prize (Booyah)
        - 2nd Prize
        - 3rd Prize
        - Per Kill Reward * total kills
        """
        first_prize = float(tournament_config.get("firstPrize", 0))
        second_prize = float(tournament_config.get("secondPrize", 0))
        third_prize = float(tournament_config.get("thirdPrize", 0))
        per_kill_prize = float(tournament_config.get("perKillPrize", 0))

        payouts = []

        for item in scoreboard_results:
            rank = item["rank"]
            kills = item["kills"]
            player = item["teamOrPlayer"]

            rank_reward = 0.0
            if rank == 1:
                rank_reward = first_prize
            elif rank == 2:
                rank_reward = second_prize
            elif rank == 3:
                rank_reward = third_prize

            kill_reward = kills * per_kill_prize
            total_earned = rank_reward + kill_reward

            payouts.append({
                "player": player,
                "rank": rank,
                "kills": kills,
                "rankReward": rank_reward,
                "killReward": kill_reward,
                "totalEarnedBDT": total_earned,
            })

        return payouts
