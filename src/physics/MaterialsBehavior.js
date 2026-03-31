function getMaterialsBehavior(MATERIAL_GROUPS, FLAGS, getSideSelectionPriority, nextRandom) {
    // GLOBAL CONSTANTS
    const {CONTAMINABLE, LIQUIDS, MELTABLE, INFLAMMABLE, FIRE_EXTINGUISH} = MATERIAL_GROUPS,
        {
            COLLISION_BOTTOM, COLLISION_TOP,
            TRANSFORM_CONTAMINANT, TRANSFORM_STONE, TRANSFORM_LAVA, TRANSFORM_FIRE, TRANSFORM_VAPOR, TRANSFORM_AIR
        } = FLAGS

    // GLOBAL VARS
    let CONTAMINATION_CHANCE,
        LAVA_MELT_CHANCE,
        FIRE_EXTINGUISHES_VAPOR_CREATION_CHANCE,
        FIRE_INFLAMMATION_CHANCE

    // Wrapper function to update the utils globals
    function _updateMaterialsBehaviorGlobals(contaminationChance, lavaMeltChance, fireExtinguishesVaporCreationChance, fireInflammationChance) {
        CONTAMINATION_CHANCE = contaminationChance
        LAVA_MELT_CHANCE = lavaMeltChance
        FIRE_EXTINGUISHES_VAPOR_CREATION_CHANCE = fireExtinguishesVaporCreationChance
        FIRE_INFLAMMATION_CHANCE = fireInflammationChance
    }

    // Defines the SAND behavior
    function applySandBehavior(i, m_B, m_R, m_L, m_BR, m_BL, transpierceableMain, transpierceableSec, indexFlags, cache) {
        if (m_B & transpierceableMain) indexFlags[i] &= ~COLLISION_BOTTOM
        else {
            if (getSideSelectionPriority() && m_R & transpierceableSec && m_BR & transpierceableSec) cache.dx += 1
            else if (m_L & transpierceableSec && m_BL & transpierceableSec) cache.dx -= 1
        }
    }
    
    // Defines the general liquid behavior
    function applyLiquidBehavior(i, m_B, m_R, m_L, transpierceableMain, transpierceableSec, indexFlags, cache) {
        if (m_B & transpierceableMain) indexFlags[i] &= ~COLLISION_BOTTOM
        else {
            const rightEmpty = m_R & transpierceableSec, leftEmpty = m_L & transpierceableSec
            if (getSideSelectionPriority()) {
                if (leftEmpty) cache.dx -= 1
                else if (rightEmpty) cache.dx += 1
            } else {
                if (rightEmpty) cache.dx += 1
                else if (leftEmpty) cache.dx -= 1
            }
        }
    }

    // Defines the GRAVEL behavior
    function applyGravelBehavior(i, m_B, transpierceableMain, indexFlags) {
        if (m_B & transpierceableMain) indexFlags[i] ^= COLLISION_BOTTOM
    }

    // Defines the INVERTED_WATER behavior
    function applyInvertedWaterBehavior(i, m_T, m_R, m_L, transpierceableMain, transpierceableSec, indexFlags, cache) {
        if (m_T & transpierceableMain) indexFlags[i] ^= COLLISION_TOP
        else {
            const rightEmpty = m_R & transpierceableSec, leftEmpty = m_L & transpierceableSec
            if (getSideSelectionPriority()) {
                if (leftEmpty) cache.dx -= 1
                else if (rightEmpty) cache.dx += 1
            } else {
                if (rightEmpty) cache.dx += 1
                else if (leftEmpty) cache.dx -= 1
            }
        }
    }

    // Defines the CONTAMINANT behavior
    function applyContaminantBehavior(m_B, m_R, m_L, m_T, gi_B, gi_R, gi_L, gi_T, gridIndexes, indexFlags) {
        if (m_B&CONTAMINABLE && nextRandom() <= CONTAMINATION_CHANCE) indexFlags[gridIndexes[gi_B]] |= TRANSFORM_CONTAMINANT
        if (m_R&CONTAMINABLE && nextRandom() <= CONTAMINATION_CHANCE) indexFlags[gridIndexes[gi_R]] |= TRANSFORM_CONTAMINANT
        if (m_L&CONTAMINABLE && nextRandom() <= CONTAMINATION_CHANCE) indexFlags[gridIndexes[gi_L]] |= TRANSFORM_CONTAMINANT
        if (m_T&CONTAMINABLE && nextRandom() <= CONTAMINATION_CHANCE) indexFlags[gridIndexes[gi_T]] |= TRANSFORM_CONTAMINANT
    }

    // Defines the LAVA behavior
    function applyLavaBehavior(gi, m_B, m_R, m_L, m_T, gi_B, gi_R, gi_L, gi_T, gridIndexes, indexFlags) {
        if (m_B&LIQUIDS||m_R&LIQUIDS||m_L&LIQUIDS||m_T&LIQUIDS) indexFlags[gridIndexes[gi]] |= TRANSFORM_STONE

        if (m_B&MELTABLE && nextRandom() <= LAVA_MELT_CHANCE) indexFlags[gridIndexes[gi_B]] |= TRANSFORM_LAVA
        if (m_R&MELTABLE && nextRandom() <= LAVA_MELT_CHANCE) indexFlags[gridIndexes[gi_R]] |= TRANSFORM_LAVA
        if (m_L&MELTABLE && nextRandom() <= LAVA_MELT_CHANCE) indexFlags[gridIndexes[gi_L]] |= TRANSFORM_LAVA
        if (m_T&MELTABLE && nextRandom() <= LAVA_MELT_CHANCE) indexFlags[gridIndexes[gi_T]] |= TRANSFORM_LAVA
    }

    // Defines the VAPOR behavior
    function applyVaporBehavior(i, m_T, m_R, m_L, transpierceableMain, indexFlags, cache) {
        if (m_T & transpierceableMain) indexFlags[i] ^= COLLISION_TOP
        else {
            if (getSideSelectionPriority()) {
                if (m_L & transpierceableMain) cache.dx -= 1
                else if (m_R & transpierceableMain) cache.dx += 1
            } else {
                if (m_R & transpierceableMain) cache.dx += 1
                else if (m_L & transpierceableMain) cache.dx -= 1
            }
        }
    }
        
    // Defines the FIRE behavior
    function applyFireBehavior(gi, m_B, m_R, m_L, m_T, gi_B, gi_R, gi_L, gi_T, gridIndexes, indexFlags) {
        if ((m_B|m_R|m_L|m_T) & FIRE_EXTINGUISH) indexFlags[gridIndexes[gi]] |= nextRandom() <= FIRE_EXTINGUISHES_VAPOR_CREATION_CHANCE ? TRANSFORM_VAPOR : TRANSFORM_AIR

        if (m_B&INFLAMMABLE && nextRandom() <= FIRE_INFLAMMATION_CHANCE) indexFlags[gridIndexes[gi_B]] |= TRANSFORM_FIRE
        if (m_R&INFLAMMABLE && nextRandom() <= FIRE_INFLAMMATION_CHANCE) indexFlags[gridIndexes[gi_R]] |= TRANSFORM_FIRE
        if (m_L&INFLAMMABLE && nextRandom() <= FIRE_INFLAMMATION_CHANCE) indexFlags[gridIndexes[gi_L]] |= TRANSFORM_FIRE
        if (m_T&INFLAMMABLE && nextRandom() <= FIRE_INFLAMMATION_CHANCE) indexFlags[gridIndexes[gi_T]] |= TRANSFORM_FIRE
    }

    return {
        _updateMaterialsBehaviorGlobals,
        applySandBehavior,
        applyLiquidBehavior,
        applyGravelBehavior,
        applyInvertedWaterBehavior,
        applyContaminantBehavior,
        applyLavaBehavior,
        applyVaporBehavior,
        applyFireBehavior,
    }
}